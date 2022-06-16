// Auto-generated , DO NOT EDIT
import {Entity, FunctionPropertyNames} from "@subql/types";
import assert from 'assert';




type BurnProps = Omit<Burn, NonNullable<FunctionPropertyNames<Burn>>>;

export class Burn implements Entity {

    constructor(id: string) {
        this.id = id;
    }


    public id: string;

    public transactionId: string;

    public timestamp: bigint;

    public pairId: string;

    public liquidity: number;

    public sender?: string;

    public amount0?: number;

    public amount1?: number;

    public to?: string;

    public logIndex?: bigint;

    public amountUSD?: number;

    public needsComplete: boolean;

    public feeTo?: string;

    public feeLiquidity?: number;


    async save(): Promise<void>{
        let id = this.id;
        assert(id !== null, "Cannot save Burn entity without an ID");
        await store.set('Burn', id.toString(), this);
    }
    static async remove(id:string): Promise<void>{
        assert(id !== null, "Cannot remove Burn entity without an ID");
        await store.remove('Burn', id.toString());
    }

    static async get(id:string): Promise<Burn | undefined>{
        assert((id !== null && id !== undefined), "Cannot get Burn entity without an ID");
        const record = await store.get('Burn', id.toString());
        if (record){
            return Burn.create(record as BurnProps);
        }else{
            return;
        }
    }


    static async getByTransactionId(transactionId: string): Promise<Burn[] | undefined>{
      
      const records = await store.getByField('Burn', 'transactionId', transactionId);
      return records.map(record => Burn.create(record as BurnProps));
      
    }

    static async getByPairId(pairId: string): Promise<Burn[] | undefined>{
      
      const records = await store.getByField('Burn', 'pairId', pairId);
      return records.map(record => Burn.create(record as BurnProps));
      
    }


    static create(record: BurnProps): Burn {
        assert(typeof record.id === 'string', "id must be provided");
        let entity = new Burn(record.id);
        Object.assign(entity,record);
        return entity;
    }
}
