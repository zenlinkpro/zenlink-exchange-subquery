// Auto-generated , DO NOT EDIT
import {Entity, FunctionPropertyNames} from "@subql/types";
import assert from 'assert';




type MintProps = Omit<Mint, NonNullable<FunctionPropertyNames<Mint>>>;

export class Mint implements Entity {

    constructor(id: string) {
        this.id = id;
    }


    public id: string;

    public transactionId: string;

    public timestamp: bigint;

    public pairId: string;

    public to: string;

    public liquidity: number;

    public sender?: string;

    public amount0?: number;

    public amount1?: number;

    public logIndex?: bigint;

    public amountUSD?: number;

    public feeTo?: string;

    public feeLiquidity?: number;


    async save(): Promise<void>{
        let id = this.id;
        assert(id !== null, "Cannot save Mint entity without an ID");
        await store.set('Mint', id.toString(), this);
    }
    static async remove(id:string): Promise<void>{
        assert(id !== null, "Cannot remove Mint entity without an ID");
        await store.remove('Mint', id.toString());
    }

    static async get(id:string): Promise<Mint | undefined>{
        assert((id !== null && id !== undefined), "Cannot get Mint entity without an ID");
        const record = await store.get('Mint', id.toString());
        if (record){
            return Mint.create(record as MintProps);
        }else{
            return;
        }
    }


    static async getByTransactionId(transactionId: string): Promise<Mint[] | undefined>{
      
      const records = await store.getByField('Mint', 'transactionId', transactionId);
      return records.map(record => Mint.create(record as MintProps));
      
    }

    static async getByPairId(pairId: string): Promise<Mint[] | undefined>{
      
      const records = await store.getByField('Mint', 'pairId', pairId);
      return records.map(record => Mint.create(record as MintProps));
      
    }


    static create(record: MintProps): Mint {
        assert(typeof record.id === 'string', "id must be provided");
        let entity = new Mint(record.id);
        Object.assign(entity,record);
        return entity;
    }
}
