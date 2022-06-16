// Auto-generated , DO NOT EDIT
import {Entity, FunctionPropertyNames} from "@subql/types";
import assert from 'assert';




type SwapProps = Omit<Swap, NonNullable<FunctionPropertyNames<Swap>>>;

export class Swap implements Entity {

    constructor(id: string) {
        this.id = id;
    }


    public id: string;

    public transactionId: string;

    public timestamp: bigint;

    public pairId: string;

    public sender: string;

    public from: string;

    public amount0In: number;

    public amount1In: number;

    public amount0Out: number;

    public amount1Out: number;

    public to: string;

    public logIndex?: bigint;

    public amountUSD: number;


    async save(): Promise<void>{
        let id = this.id;
        assert(id !== null, "Cannot save Swap entity without an ID");
        await store.set('Swap', id.toString(), this);
    }
    static async remove(id:string): Promise<void>{
        assert(id !== null, "Cannot remove Swap entity without an ID");
        await store.remove('Swap', id.toString());
    }

    static async get(id:string): Promise<Swap | undefined>{
        assert((id !== null && id !== undefined), "Cannot get Swap entity without an ID");
        const record = await store.get('Swap', id.toString());
        if (record){
            return Swap.create(record as SwapProps);
        }else{
            return;
        }
    }


    static async getByTransactionId(transactionId: string): Promise<Swap[] | undefined>{
      
      const records = await store.getByField('Swap', 'transactionId', transactionId);
      return records.map(record => Swap.create(record as SwapProps));
      
    }

    static async getByPairId(pairId: string): Promise<Swap[] | undefined>{
      
      const records = await store.getByField('Swap', 'pairId', pairId);
      return records.map(record => Swap.create(record as SwapProps));
      
    }


    static create(record: SwapProps): Swap {
        assert(typeof record.id === 'string', "id must be provided");
        let entity = new Swap(record.id);
        Object.assign(entity,record);
        return entity;
    }
}
