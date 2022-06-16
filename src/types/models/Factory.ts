// Auto-generated , DO NOT EDIT
import {Entity, FunctionPropertyNames} from "@subql/types";
import assert from 'assert';




type FactoryProps = Omit<Factory, NonNullable<FunctionPropertyNames<Factory>>>;

export class Factory implements Entity {

    constructor(id: string) {
        this.id = id;
    }


    public id: string;

    public pairCount: number;

    public totalVolumeUSD: number;

    public totalVolumeETH: number;

    public untrackedVolumeUSD: number;

    public totalLiquidityUSD: number;

    public totalLiquidityETH: number;

    public txCount: bigint;


    async save(): Promise<void>{
        let id = this.id;
        assert(id !== null, "Cannot save Factory entity without an ID");
        await store.set('Factory', id.toString(), this);
    }
    static async remove(id:string): Promise<void>{
        assert(id !== null, "Cannot remove Factory entity without an ID");
        await store.remove('Factory', id.toString());
    }

    static async get(id:string): Promise<Factory | undefined>{
        assert((id !== null && id !== undefined), "Cannot get Factory entity without an ID");
        const record = await store.get('Factory', id.toString());
        if (record){
            return Factory.create(record as FactoryProps);
        }else{
            return;
        }
    }



    static create(record: FactoryProps): Factory {
        assert(typeof record.id === 'string', "id must be provided");
        let entity = new Factory(record.id);
        Object.assign(entity,record);
        return entity;
    }
}
