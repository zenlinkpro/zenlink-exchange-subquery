// Auto-generated , DO NOT EDIT
import {Entity, FunctionPropertyNames} from "@subql/types";
import assert from 'assert';




type LiquidityPositionSnapshotProps = Omit<LiquidityPositionSnapshot, NonNullable<FunctionPropertyNames<LiquidityPositionSnapshot>>>;

export class LiquidityPositionSnapshot implements Entity {

    constructor(id: string) {
        this.id = id;
    }


    public id: string;

    public liquidityPositionId: string;

    public timestamp: number;

    public block: number;

    public userId: string;

    public pairId: string;

    public token0PriceUSD: number;

    public token1PriceUSD: number;

    public reserve0: number;

    public reserve1: number;

    public reserveUSD: number;

    public liquidityTokenTotalSupply: number;

    public liquidityTokenBalance: number;


    async save(): Promise<void>{
        let id = this.id;
        assert(id !== null, "Cannot save LiquidityPositionSnapshot entity without an ID");
        await store.set('LiquidityPositionSnapshot', id.toString(), this);
    }
    static async remove(id:string): Promise<void>{
        assert(id !== null, "Cannot remove LiquidityPositionSnapshot entity without an ID");
        await store.remove('LiquidityPositionSnapshot', id.toString());
    }

    static async get(id:string): Promise<LiquidityPositionSnapshot | undefined>{
        assert((id !== null && id !== undefined), "Cannot get LiquidityPositionSnapshot entity without an ID");
        const record = await store.get('LiquidityPositionSnapshot', id.toString());
        if (record){
            return LiquidityPositionSnapshot.create(record as LiquidityPositionSnapshotProps);
        }else{
            return;
        }
    }


    static async getByLiquidityPositionId(liquidityPositionId: string): Promise<LiquidityPositionSnapshot[] | undefined>{
      
      const records = await store.getByField('LiquidityPositionSnapshot', 'liquidityPositionId', liquidityPositionId);
      return records.map(record => LiquidityPositionSnapshot.create(record as LiquidityPositionSnapshotProps));
      
    }

    static async getByUserId(userId: string): Promise<LiquidityPositionSnapshot[] | undefined>{
      
      const records = await store.getByField('LiquidityPositionSnapshot', 'userId', userId);
      return records.map(record => LiquidityPositionSnapshot.create(record as LiquidityPositionSnapshotProps));
      
    }

    static async getByPairId(pairId: string): Promise<LiquidityPositionSnapshot[] | undefined>{
      
      const records = await store.getByField('LiquidityPositionSnapshot', 'pairId', pairId);
      return records.map(record => LiquidityPositionSnapshot.create(record as LiquidityPositionSnapshotProps));
      
    }


    static create(record: LiquidityPositionSnapshotProps): LiquidityPositionSnapshot {
        assert(typeof record.id === 'string', "id must be provided");
        let entity = new LiquidityPositionSnapshot(record.id);
        Object.assign(entity,record);
        return entity;
    }
}
