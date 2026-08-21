import { IsString } from "class-validator";
import { BeforeInsert, BeforeUpdate, Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity('users')
export class User {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column('text', {
        unique: true
    })
    email:string;

    @Column('text', {
        select: false
    })
    password: string;

    @Column('text')
    fullName: string;

    @Column('bool', {
        default: true,
    })
    isActive: string;

    @Column('text', {
        array: true,
        default: ['user']
    })
    roles: string[];
    
    @BeforeInsert()
    @BeforeUpdate()
    lowerCaser() {
        this.email = this.email.toLowerCase().trim();
    }
}
