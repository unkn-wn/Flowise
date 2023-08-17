import { INode, INodeData, INodeOutputsValue, INodeParams } from '../../../src/Interface'
import { Embeddings } from 'langchain/embeddings/base'
import { Document } from 'langchain/document'
import { getBaseClasses } from '../../../src/utils'
import { LanceDB } from 'langchain/vectorstores/lancedb'
import { flatten } from 'lodash'
import { connect } from 'vectordb'


class LanceUpsert_VectorStores implements INode {
    label: string
    name: string
    version: number
    description: string
    type: string
    icon: string
    category: string
    baseClasses: string[]
    inputs: INodeParams[]
    outputs: INodeOutputsValue[]

    constructor() {
        this.label = 'LanceDB Upsert Document'
        this.name = 'lanceUpsert'
        this.version = 1.0
        this.type = 'LanceDB'
        this.icon = 'lance.svg' // to add
        this.category = 'Vector Stores'
        this.description = 'Upsert documents to LanceDB'
        this.baseClasses = [this.type, 'VectorStoreRetriever', 'BaseRetriever']
        this.inputs = [
            {
                label: 'Document',
                name: 'document',
                type: 'Document',
                list: true
            },
            {
                label: 'Embeddings',
                name: 'embeddings',
                type: 'Embeddings'
            },
           {
                label: 'Connection URI',
                name: 'uriPath',
                description: 'Path to connect to LanceDB',
                placeholder: `C:\\Users\\User\\Desktop`,
                type: 'string'
            },
            {
                label: 'Table Name',
                name: 'tableName',
                description: 'Name of the table to store the index',
                type: 'string'
            },
            {
                label: 'Top K',
                name: 'topK',
                description: 'Number of top results to fetch. Default to 4',
                placeholder: '4',
                type: 'number',
                additionalParams: true,
                optional: true
            }
        ]
        this.outputs = [
            {
                label: 'LanceDB Retriever',
                name: 'retriever',
                baseClasses: this.baseClasses
            },
            {
                label: 'LanceDB Vector Store',
                name: 'vectorStore',
                baseClasses: [this.type, ...getBaseClasses(LanceDB)]
            }
        ]
    }

    async init(nodeData: INodeData): Promise<any> {
        const docs = nodeData.inputs?.document as Document[]
        const embeddings = nodeData.inputs?.embeddings as Embeddings
        const output = nodeData.outputs?.output as string
        const uriPath = nodeData.inputs?.uriPath as string
        const tableName = nodeData.inputs?.tableName as string
        const topK = nodeData.inputs?.topK as string
        const k = topK ? parseFloat(topK) : 4

        const flattenDocs = docs && docs.length ? flatten(docs) : []
        const finalDocs = []
        for (let i = 0; i < flattenDocs.length; i += 1) {
            finalDocs.push(new Document(flattenDocs[i]))
        }
        console.log(flattenDocs)
        const db = await connect(uriPath)
        var table
        if ((await db.tableNames()).includes(tableName)) {
            table = await db.openTable(tableName)
        } else {
            // table = await db.createTable(tableName)
            // Create table if it doesn't exist, but not sure how to because I'm given langchain Documents
        }
        const vectorStore = await LanceDB.fromDocuments(finalDocs, embeddings, { table })

        if (output === 'retriever') {
            const retriever = vectorStore.asRetriever(k)
            return retriever
        } else if (output === 'vectorStore') {
            ;(vectorStore as any).k = k
            return vectorStore
        }
        return vectorStore
    }
}

module.exports = { nodeClass: LanceUpsert_VectorStores }
