const { Block, Blockchain, stuChain } = require("./bockchain.js");

const blocks = [
    { from: "John", to: "Bob", amount: 100 },
    { from: "Bob", to: "John", amount: 100 },
    { from: "Stu", to: "Bob", amount: 100 },
    { from: "Bob", to: "Stu", amount: 100 },
    { from: "Tim", to: "Bob", amount: 100 }
]

// loop transactions to add to blockchain
blocks.forEach(block => {
    stuChain.addBlock(new Block(Date.now().toString(), block));
})

console.log(stuChain.chain);