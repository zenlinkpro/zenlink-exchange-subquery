// Auto-generated , DO NOT EDIT
import {Entity, FunctionPropertyNames} from "@subql/types";
import assert from 'assert';




type PairProps = Omit<Pair, NonNullable<FunctionPropertyNames<Pair>>>;

export class Pair implements Entity {

    constructor(id: string) {
        this.id = id;
    }


    public id: string;

    public token0Id: string;

    public token1Id: string;

    public reserve0: number;

    public reserve1: number;

    public totalSupply: number;

    public reserveETH: number;

    public reserveUSD: number;

    public trackedReserveETH: number;

    public token0Price: number;

    public token1Price: number;

    public volumeToken0: number;

    public volumeToken1: number;

    public volumeUSD: number;

    public untrackedVolumeUSD: number;

    public txCount: bigint;

    public createdAtTimestamp: bigint;

    public createdAtBlockNumber: bigint;

    public liquidityProviderCount: bigint;


    async save(): Promise<void>{
        let id = this.id;
        assert(id !== null, "Cannot save Pair entity without an ID");
        await store.set('Pair', id.toString(), this);
    }
    static async remove(id:string): Promise<void>{
        assert(id !== null, "Cannot remove Pair entity without an ID");
        await store.remove('Pair', id.toString());
    }

    static async get(id:string): Promise<Pair | undefined>{
        assert((id !== null && id !== undefined), "Cannot get Pair entity without an ID");
        const record = await store.get('Pair', id.toString());
        if (record){
            return Pair.create(record as PairProps);
        }else{
            return;
        }
    }


    static async getByToken0Id(token0Id: string): Promise<Pair[] | undefined>{
      
      const records = await store.getByField('Pair', 'token0Id', token0Id);
      return records.map(record => Pair.create(record as PairProps));
      
    }

    static async getByToken1Id(token1Id: string): Promise<Pair[] | undefined>{
      
      const records = await store.getByField('Pair', 'token1Id', token1Id);
      return records.map(record => Pair.create(record as PairProps));
      
    }


    static create(record: PairProps): Pair {
        assert(typeof record.id === 'string', "id must be provided");
        let entity = new Pair(record.id);
        Object.assign(entity,record);
        return entity;
    }
}
