// Auto-generated , DO NOT EDIT
import {Entity, FunctionPropertyNames} from "@subql/types";
import assert from 'assert';




type TokenDayDataProps = Omit<TokenDayData, NonNullable<FunctionPropertyNames<TokenDayData>>>;

export class TokenDayData implements Entity {

    constructor(id: string) {
        this.id = id;
    }


    public id: string;

    public date: number;

    public tokenId: string;

    public dailyVolumeToken: number;

    public dailyVolumeETH: number;

    public dailyVolumeUSD: number;

    public dailyTxns: bigint;

    public totalLiquidityToken: number;

    public totalLiquidityETH: number;

    public totalLiquidityUSD: number;

    public priceUSD: number;


    async save(): Promise<void>{
        let id = this.id;
        assert(id !== null, "Cannot save TokenDayData entity without an ID");
        await store.set('TokenDayData', id.toString(), this);
    }
    static async remove(id:string): Promise<void>{
        assert(id !== null, "Cannot remove TokenDayData entity without an ID");
        await store.remove('TokenDayData', id.toString());
    }

    static async get(id:string): Promise<TokenDayData | undefined>{
        assert((id !== null && id !== undefined), "Cannot get TokenDayData entity without an ID");
        const record = await store.get('TokenDayData', id.toString());
        if (record){
            return TokenDayData.create(record as TokenDayDataProps);
        }else{
            return;
        }
    }


    static async getByTokenId(tokenId: string): Promise<TokenDayData[] | undefined>{
      
      const records = await store.getByField('TokenDayData', 'tokenId', tokenId);
      return records.map(record => TokenDayData.create(record as TokenDayDataProps));
      
    }


    static create(record: TokenDayDataProps): TokenDayData {
        assert(typeof record.id === 'string', "id must be provided");
        let entity = new TokenDayData(record.id);
        Object.assign(entity,record);
        return entity;
    }
}
