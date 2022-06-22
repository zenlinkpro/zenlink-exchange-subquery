// Auto-generated , DO NOT EDIT
import {Entity, FunctionPropertyNames} from "@subql/types";
import assert from 'assert';




type PairDayDataProps = Omit<PairDayData, NonNullable<FunctionPropertyNames<PairDayData>>>;

export class PairDayData implements Entity {

    constructor(id: string) {
        this.id = id;
    }


    public id: string;

    public date: bigint;

    public pairAddress: string;

    public token0Id: string;

    public token1Id: string;

    public reserve0: number;

    public reserve1: number;

    public totalSupply: number;

    public reserveUSD: number;

    public dailyVolumeToken0: number;

    public dailyVolumeToken1: number;

    public dailyVolumeUSD: number;

    public dailyTxns: bigint;


    async save(): Promise<void>{
        let id = this.id;
        assert(id !== null, "Cannot save PairDayData entity without an ID");
        await store.set('PairDayData', id.toString(), this);
    }
    static async remove(id:string): Promise<void>{
        assert(id !== null, "Cannot remove PairDayData entity without an ID");
        await store.remove('PairDayData', id.toString());
    }

    static async get(id:string): Promise<PairDayData | undefined>{
        assert((id !== null && id !== undefined), "Cannot get PairDayData entity without an ID");
        const record = await store.get('PairDayData', id.toString());
        if (record){
            return PairDayData.create(record as PairDayDataProps);
        }else{
            return;
        }
    }


    static async getByToken0Id(token0Id: string): Promise<PairDayData[] | undefined>{
      
      const records = await store.getByField('PairDayData', 'token0Id', token0Id);
      return records.map(record => PairDayData.create(record as PairDayDataProps));
      
    }

    static async getByToken1Id(token1Id: string): Promise<PairDayData[] | undefined>{
      
      const records = await store.getByField('PairDayData', 'token1Id', token1Id);
      return records.map(record => PairDayData.create(record as PairDayDataProps));
      
    }


    static create(record: PairDayDataProps): PairDayData {
        assert(typeof record.id === 'string', "id must be provided");
        let entity = new PairDayData(record.id);
        Object.assign(entity,record);
        return entity;
    }
}
