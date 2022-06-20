// Auto-generated , DO NOT EDIT
import {Entity, FunctionPropertyNames} from "@subql/types";
import assert from 'assert';




type TransactionProps = Omit<Transaction, NonNullable<FunctionPropertyNames<Transaction>>>;

export class Transaction implements Entity {

    constructor(id: string) {
        this.id = id;
    }


    public id: string;

    public blockNumber: bigint;

    public timestamp: bigint;

    public mints: string[];

    public burns: string[];

    public swaps: string[];


    async save(): Promise<void>{
        let id = this.id;
        assert(id !== null, "Cannot save Transaction entity without an ID");
        await store.set('Transaction', id.toString(), this);
    }
    static async remove(id:string): Promise<void>{
        assert(id !== null, "Cannot remove Transaction entity without an ID");
        await store.remove('Transaction', id.toString());
    }

    static async get(id:string): Promise<Transaction | undefined>{
        assert((id !== null && id !== undefined), "Cannot get Transaction entity without an ID");
        const record = await store.get('Transaction', id.toString());
        if (record){
            return Transaction.create(record as TransactionProps);
        }else{
            return;
        }
    }



    static create(record: TransactionProps): Transaction {
        assert(typeof record.id === 'string', "id must be provided");
        let entity = new Transaction(record.id);
        Object.assign(entity,record);
        return entity;
    }
}
