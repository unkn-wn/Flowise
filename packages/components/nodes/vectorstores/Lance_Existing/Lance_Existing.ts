import { INode, INodeData, INodeOutputsValue, INodeParams } from '../../../src/Interface'
import { LanceDB } from 'langchain/vectorstores/lancedb'
import { Embeddings } from 'langchain/embeddings/base'
import { getBaseClasses } from '../../../src/utils'
import { connect } from 'vectordb'


class Lance_Existing_VectorStores implements INode {
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
        this.label = 'LanceDB Load Existing Index'
        this.name = 'lanceExistingIndex'
        this.version = 1.0
        this.type = 'LanceDB'
        this.icon = 'lance.svg' // to add
        this.category = 'Vector Stores'
        this.description = 'Load existing index from LanceDB (i.e: Document has been upserted)'
        this.baseClasses = [this.type, 'VectorStoreRetriever', 'BaseRetriever']
        this.inputs = [
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
        const embeddings = nodeData.inputs?.embeddings as Embeddings
        const uriPath = nodeData.inputs?.uriPath as string
        const tableName = nodeData.inputs?.tableName as string
        const output = nodeData.outputs?.output as string
        const topK = nodeData.inputs?.topK as string
        const k = topK ? parseFloat(topK) : 4

        const db = await connect(uriPath)
        const table = await db.openTable(tableName)
        const vectorStore = new LanceDB(embeddings, { table })

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

module.exports = { nodeClass: Lance_Existing_VectorStores }
