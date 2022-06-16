// Auto-generated , DO NOT EDIT
import {Entity, FunctionPropertyNames} from "@subql/types";
import assert from 'assert';




type LiquidityPositionProps = Omit<LiquidityPosition, NonNullable<FunctionPropertyNames<LiquidityPosition>>>;

export class LiquidityPosition implements Entity {

    constructor(id: string) {
        this.id = id;
    }


    public id: string;

    public userId: string;

    public pairId: string;

    public liquidityTokenBalance: number;


    async save(): Promise<void>{
        let id = this.id;
        assert(id !== null, "Cannot save LiquidityPosition entity without an ID");
        await store.set('LiquidityPosition', id.toString(), this);
    }
    static async remove(id:string): Promise<void>{
        assert(id !== null, "Cannot remove LiquidityPosition entity without an ID");
        await store.remove('LiquidityPosition', id.toString());
    }

    static async get(id:string): Promise<LiquidityPosition | undefined>{
        assert((id !== null && id !== undefined), "Cannot get LiquidityPosition entity without an ID");
        const record = await store.get('LiquidityPosition', id.toString());
        if (record){
            return LiquidityPosition.create(record as LiquidityPositionProps);
        }else{
            return;
        }
    }


    static async getByUserId(userId: string): Promise<LiquidityPosition[] | undefined>{
      
      const records = await store.getByField('LiquidityPosition', 'userId', userId);
      return records.map(record => LiquidityPosition.create(record as LiquidityPositionProps));
      
    }

    static async getByPairId(pairId: string): Promise<LiquidityPosition[] | undefined>{
      
      const records = await store.getByField('LiquidityPosition', 'pairId', pairId);
      return records.map(record => LiquidityPosition.create(record as LiquidityPositionProps));
      
    }


    static create(record: LiquidityPositionProps): LiquidityPosition {
        assert(typeof record.id === 'string', "id must be provided");
        let entity = new LiquidityPosition(record.id);
        Object.assign(entity,record);
        return entity;
    }
}
