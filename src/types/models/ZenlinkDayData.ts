// Auto-generated , DO NOT EDIT
import {Entity, FunctionPropertyNames} from "@subql/types";
import assert from 'assert';




type ZenlinkDayDataProps = Omit<ZenlinkDayData, NonNullable<FunctionPropertyNames<ZenlinkDayData>>>;

export class ZenlinkDayData implements Entity {

    constructor(id: string) {
        this.id = id;
    }


    public id: string;

    public date: bigint;

    public dailyVolumeETH: number;

    public dailyVolumeUSD: number;

    public dailyVolumeUntracked: number;

    public totalVolumeETH: number;

    public totalLiquidityETH: number;

    public totalVolumeUSD: number;

    public totalLiquidityUSD: number;

    public txCount: bigint;


    async save(): Promise<void>{
        let id = this.id;
        assert(id !== null, "Cannot save ZenlinkDayData entity without an ID");
        await store.set('ZenlinkDayData', id.toString(), this);
    }
    static async remove(id:string): Promise<void>{
        assert(id !== null, "Cannot remove ZenlinkDayData entity without an ID");
        await store.remove('ZenlinkDayData', id.toString());
    }

    static async get(id:string): Promise<ZenlinkDayData | undefined>{
        assert((id !== null && id !== undefined), "Cannot get ZenlinkDayData entity without an ID");
        const record = await store.get('ZenlinkDayData', id.toString());
        if (record){
            return ZenlinkDayData.create(record as ZenlinkDayDataProps);
        }else{
            return;
        }
    }



    static create(record: ZenlinkDayDataProps): ZenlinkDayData {
        assert(typeof record.id === 'string', "id must be provided");
        let entity = new ZenlinkDayData(record.id);
        Object.assign(entity,record);
        return entity;
    }
}
