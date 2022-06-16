// Auto-generated , DO NOT EDIT
import {Entity, FunctionPropertyNames} from "@subql/types";
import assert from 'assert';




type UserProps = Omit<User, NonNullable<FunctionPropertyNames<User>>>;

export class User implements Entity {

    constructor(id: string) {
        this.id = id;
    }


    public id: string;

    public usdSwapped: number;


    async save(): Promise<void>{
        let id = this.id;
        assert(id !== null, "Cannot save User entity without an ID");
        await store.set('User', id.toString(), this);
    }
    static async remove(id:string): Promise<void>{
        assert(id !== null, "Cannot remove User entity without an ID");
        await store.remove('User', id.toString());
    }

    static async get(id:string): Promise<User | undefined>{
        assert((id !== null && id !== undefined), "Cannot get User entity without an ID");
        const record = await store.get('User', id.toString());
        if (record){
            return User.create(record as UserProps);
        }else{
            return;
        }
    }



    static create(record: UserProps): User {
        assert(typeof record.id === 'string', "id must be provided");
        let entity = new User(record.id);
        Object.assign(entity,record);
        return entity;
    }
}
