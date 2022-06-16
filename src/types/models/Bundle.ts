// Auto-generated , DO NOT EDIT
import {Entity, FunctionPropertyNames} from "@subql/types";
import assert from 'assert';




type BundleProps = Omit<Bundle, NonNullable<FunctionPropertyNames<Bundle>>>;

export class Bundle implements Entity {

    constructor(id: string) {
        this.id = id;
    }


    public id: string;

    public ethPrice: number;


    async save(): Promise<void>{
        let id = this.id;
        assert(id !== null, "Cannot save Bundle entity without an ID");
        await store.set('Bundle', id.toString(), this);
    }
    static async remove(id:string): Promise<void>{
        assert(id !== null, "Cannot remove Bundle entity without an ID");
        await store.remove('Bundle', id.toString());
    }

    static async get(id:string): Promise<Bundle | undefined>{
        assert((id !== null && id !== undefined), "Cannot get Bundle entity without an ID");
        const record = await store.get('Bundle', id.toString());
        if (record){
            return Bundle.create(record as BundleProps);
        }else{
            return;
        }
    }



    static create(record: BundleProps): Bundle {
        assert(typeof record.id === 'string', "id must be provided");
        let entity = new Bundle(record.id);
        Object.assign(entity,record);
        return entity;
    }
}
