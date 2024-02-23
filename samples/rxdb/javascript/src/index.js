import {
    createRxDatabase
} from 'rxdb';
import {
    getRxStorageMemory
} from 'rxdb/plugins/storage-memory';
import {
    setFlutterRxDatabaseConnector
} from 'rxdb/plugins/flutter';

async function createDB(databaseName) {
    const db = await createRxDatabase({
        name: databaseName,
        storage: getRxStorageMemory(),
        multiInstance: false
    });
    await db.addCollections({
        AppState: {
            schema: {
                version: 0,
                primaryKey: 'id',
                type: 'object',
                properties: {
                    id: {
                        type: 'string',
                        maxLength: 100
                    },
                    width: {
                        type: 'number'
                    },
                    length: {
                        type: 'number'
                    },
                    area: {
                        type: 'number'
                    },
                    killSwitch: {
                        type: 'boolean'
                    }
                },
                required: ['id']
            }
        }
    });
    return db;
}

setFlutterRxDatabaseConnector(
    createDB
);
