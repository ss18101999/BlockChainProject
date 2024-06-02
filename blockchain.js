const crypto = require('crypto'); SHA256 = message => crypto.createHash('sha256').update(message).digest('hex');
const EC = require('elliptic').ec, ec = new EC('secp256k1');

const MINT_WALLET = ec.genKeyPair();
const MINT_PUBLIC_ADDRESS = MINT_WALLET.getPublic('hex');
const MINT_PRIVATE_ADDRESS = MINT_WALLET.getPrivate('hex');
class Block{
    constructor(data = []){
        this.timestamp = Date.now();
        this.data = data;
        this.hash = this.getHash();
        this.prevHash = "";
        this.nonce = 0;
    }


    getHash(){
        return SHA256(this.timestamp+JSON.stringify(this.data)+this.prevHash+this.nonce);
    }

    mine(difficulty){
        while(!this.hash.startsWith(Array(difficulty+1).join('0'))){
            this.nonce++;
            this.hash = this.getHash();
        } 
    }

    hasValidTransactions(chain){
        return this.data.every(transaction => transaction.isValid(transaction, chain));
    }
}

class BlockChain{
    constructor(){
        this.chain = [new Block([new Transaction(MINT_PUBLIC_ADDRESS,JOHN_WALLET.getPublic('hex'),1000)])];
        this.difficulty = 2;
        this.blockTime = 5000;
        this.transactions = [];
        this.reward = 10;
    }

    addTransaction(transaction){
        if(transaction.isValid(transaction,this)){
            this.transactions.push(transaction);
        }
    }

    mineTransactions(rewardAddress){
        let gas = 0;
        this.transactions.forEach(transaction=>{
            gas += transaction.gas;
        })
        const rewardTransaction = new Transaction(MINT_PUBLIC_ADDRESS,rewardAddress,this.reward+gas);
        this.addBlock(new Block([rewardTransaction,...this.transactions]));
        this.transactions = [];
    }

    getBalance(address){
        let balance = 0;
        this.chain.forEach(block=>{
            //console.log(block);
            block.data.forEach(transaction=>{
                if(transaction.from===address){
                    balance-=transaction.amount;
                    balance-=transaction.gas;
                }
                if(transaction.to===address){
                    balance+=transaction.amount;
                }
            })
        })
        return balance;
    }

    getlastBlock(){
        return this.chain[this.chain.length-1];
    }
    addBlock(block){
        block.prevHash = this.getlastBlock().hash;
        block.mine(this.difficulty);
        this.chain.push(block);
        this.difficulty+=Date.now()-this.getlastBlock().timestamp<this.blockTime?1:-1;
    }

    isValid(){
        for(let i=1;i<this.chain.length;i++){
            const currentBlock = this.chain[i];
            const prevBlock = this.chain[i-1];

            if(currentBlock.hash !== currentBlock.getHash() || currentBlock.prevHash!==prevBlock.hash ||
        !currentBlock.hasValidTransactions(this)){
                return false;
            }
            else{
                return true;
            }
        }
    }
}
class Transaction{
    constructor(from,to,amount,gas=0){
        this.from = from;
        this.to=to;
        this.amount=amount;
        this.gas=gas;
    }

    sign(keyPair){
        if(keyPair.getPublic('hex') == this.from){
            this.signature = keyPair.sign(SHA256(this.from+this.to+this.amount+this.gas)).toDER('hex');
        }
    }

    isValid(tx, chain){
        return(
            tx.from &&
            tx.to &&
            tx.amount &&
            chain.getBalance(tx.from) >= tx.amount+tx.gas &&
            ec.keyFromPublic(tx.from,'hex').verify(SHA256(tx.from+tx.to+tx.amount+this.gas),tx.signature)
        )
    }
}

const JOHN_WALLET = ec.genKeyPair();
const JENIFER_WALLET = ec.genKeyPair();
const MINER_WALLET = ec.genKeyPair();
const BOB_WALLET = ec.genKeyPair();

const SatoshiCoin = new BlockChain();

const transaction1 = new Transaction(JOHN_WALLET.getPublic('hex'),JENIFER_WALLET.getPublic('hex'),200,20);
transaction1.sign(JOHN_WALLET);
SatoshiCoin.addTransaction(transaction1);
SatoshiCoin.mineTransactions(MINER_WALLET.getPublic('hex'));

const transaction2 = new Transaction(JENIFER_WALLET.getPublic('hex'),BOB_WALLET.getPublic('hex'),100,10);
transaction2.sign(JENIFER_WALLET);
SatoshiCoin.addTransaction(transaction2);
SatoshiCoin.mineTransactions(MINER_WALLET.getPublic('hex'));


console.log(SatoshiCoin.chain);

console.log("John'a Balance:",SatoshiCoin.getBalance(JOHN_WALLET.getPublic('hex')));
console.log("Jennifers'a Balance:",SatoshiCoin.getBalance(JENIFER_WALLET.getPublic('hex')));
console.log("Bob'a Balance:",SatoshiCoin.getBalance(BOB_WALLET.getPublic('hex')));
console.log("Miner'a Balance:",SatoshiCoin.getBalance(MINER_WALLET.getPublic('hex')));