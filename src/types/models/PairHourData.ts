// Auto-generated , DO NOT EDIT
import {Entity, FunctionPropertyNames} from "@subql/types";
import assert from 'assert';




type PairHourDataProps = Omit<PairHourData, NonNullable<FunctionPropertyNames<PairHourData>>>;

export class PairHourData implements Entity {

    constructor(id: string) {
        this.id = id;
    }


    public id: string;

    public hourStartUnix: number;

    public pairId: string;

    public reserve0: number;

    public reserve1: number;

    public totalSupply: number;

    public reserveUSD: number;

    public hourlyVolumeToken0: number;

    public hourlyVolumeToken1: number;

    public hourlyVolumeUSD: number;

    public hourlyTxns: bigint;


    async save(): Promise<void>{
        let id = this.id;
        assert(id !== null, "Cannot save PairHourData entity without an ID");
        await store.set('PairHourData', id.toString(), this);
    }
    static async remove(id:string): Promise<void>{
        assert(id !== null, "Cannot remove PairHourData entity without an ID");
        await store.remove('PairHourData', id.toString());
    }

    static async get(id:string): Promise<PairHourData | undefined>{
        assert((id !== null && id !== undefined), "Cannot get PairHourData entity without an ID");
        const record = await store.get('PairHourData', id.toString());
        if (record){
            return PairHourData.create(record as PairHourDataProps);
        }else{
            return;
        }
    }


    static async getByPairId(pairId: string): Promise<PairHourData[] | undefined>{
      
      const records = await store.getByField('PairHourData', 'pairId', pairId);
      return records.map(record => PairHourData.create(record as PairHourDataProps));
      
    }


    static create(record: PairHourDataProps): PairHourData {
        assert(typeof record.id === 'string', "id must be provided");
        let entity = new PairHourData(record.id);
        Object.assign(entity,record);
        return entity;
    }
}
