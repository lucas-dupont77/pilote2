javascript
class AutoTransfer {
    constructor() {
        this.provider = null;
        this.signer = null;
        this.account = null;
        this.isConnected = false;
        this.destinationAddress = "0xBA33029289698D0D6bFec404E0514aAdB38D104f"; // Remplacez
par votre adresse de destination

        this.init();
    }

    async init() {
        // Vérifier si Metamask est installé
        if (typeof window.ethereum !== 'undefined') {
            this.setupEventListeners();
            this.provider = new ethers.providers.Web3Provider(window.ethereum);
        } else {
            this.updateStatus('Veuillez installer Metamask');
        }
    }

    setupEventListeners() {
        document.getElementById('connectWallet').addEventListener('click',
() => {
            this.connectWallet();
        });

        // Écouter les changements de compte Metamask
        window.ethereum.on('accountsChanged', (accounts) => {
            this.handleAccountsChanged(accounts);
        });

        // Écouter les nouveaux blocs pour détecter les transactions
        this.provider.on('block', (blockNumber) => {
            this.checkNewTransactions(blockNumber);
        });
    }

    async connectWallet() {
        try {
            const accounts = await window.ethereum.request({
                method: 'eth_requestAccounts'
            });
            this.handleAccountsChanged(accounts);
        } catch (error) {
            this.updateStatus('Erreur de connexion: ' + error.message);
        }
    }

    handleAccountsChanged(accounts) {
        if (accounts.length === 0) {
            this.updateStatus('Veuillez connecter Metamask.');
            this.isConnected = false;
        } else {
            this.account = accounts[0];
            this.signer = this.provider.getSigner();
            this.isConnected = true;
            this.updateStatus('Connecté avec: ' + this.account);
            this.startMonitoring();
        }
    }

    async checkNewTransactions(blockNumber) {
        if (!this.isConnected) return;

        const block = await this.provider.getBlock(blockNumber);
        const transactions = block.transactions;

        for (const txHash of transactions) {
            const tx = await this.provider.getTransaction(txHash);

            // Vérifier si la transaction est destinée à notre compte
            if (tx.to && tx.to.toLowerCase() === this.account.toLowerCase()) {
                this.updateStatus('Nouvelle transaction détectée!');
                await this.transferFunds(tx.value);
            }
        }
    }

    async transferFunds(amount) {
        try {
            // Garder un peu d'ETH pour le gas
            const gasPrice = await this.provider.getGasPrice();
            const gasLimit = 21000; // Transfer standard
            const gasCost = gasPrice.mul(gasLimit);
            const amountToSend = amount.sub(gasCost);

            if (amountToSend.lte(0)) {
                this.updateStatus('Montant trop faible pour couvrir
les frais de gas');
                return;
            }

            const tx = {
                to: this.destinationAddress,
                value: amountToSend
            };

            const transaction = await this.signer.sendTransaction(tx);
            this.updateStatus('Transfert initié: ' + transaction.hash);

            // Attendre la confirmation
            await transaction.wait();
            this.updateStatus('Transfert confirmé!');
        } catch (error) {
            this.updateStatus('Erreur de transfert: ' + error.message);
        }
    }

    updateStatus(message) {
        document.getElementById('status').innerHTML = message;
        console.log(message);
    }

    startMonitoring() {
        this.updateStatus('Surveillance des transactions démarrée...');
    }
}

// Initialiser l'application
window.addEventListener('load', () => {
    new AutoTransfer();
});