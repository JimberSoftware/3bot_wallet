import FormComponent from './components/formComponent';
import QrDialog from './components/qrDialog';
import TransactionInfoDialog from './components/transactionInfoDialog';
import { mapGetters, mapActions, mapMutations } from 'vuex';
import {
    buildFundedPaymentTransaction,
    submitFundedTransaction,
} from '@jimber/stellar-crypto';
import Logger from 'js-logger';
import { formatBalance } from '../../utils/filters/formatBalance';
import validate from 'bitcoin-address-validation';

export default {
    name: 'transfer',
    components: {
        FormComponent,
        TransactionInfoDialog,
        // QrScannerDialog,
        QrDialog,
    },
    data() {
        return {
            tabs: ['receive', 'send'],
            transactionInfoDialog: false,
            qrScannerDialog: false,
            qrDialog: false,
            formObject: {
                to: { address: null },
                amount: null,
                message: '',
                sender: null,
            },
            selectedTab: 1,
            selectedAccount: {},
            qrReadingError: false,
            selectedCurrency: 'TFTA',
            fee: 0.1,
            accountsReady: false,
        };
    },
    mounted() {
        this.disableAccountEventStreams();
        const updatePromises = this.accounts.map(account =>
            this.updateAccount(account.id),
        );

        Promise.all(updatePromises).then(() => {
            this.accountsReady = true;
        });

        this.$router.replace({
            query: { tab: this.tabs[this.tabs.length - 1] },
        });
        if (this.$route.params.account) {
            this.selectedAccount = this.accounts.find(
                x => x.id === this.$route.params.account,
            );
            return;
        }
        if (!this.selectedAccount.address)
            this.selectedAccount = this.accounts[0];
    },
    computed: {
        ...mapGetters(['accounts', 'currencies']),
        active() {
            return this.$route.query.tab;
        },
        isValidBtcAddress() {
            if (this.selectedCurrency !== 'BTC'){
                return false;
            }
            if (!this.formObject || !this.formObject.to || !this.formObject.to.address) {
                return false;
            }
            try {
                return validate(this.formObject.to.address, 'mainnet');
            } catch (e) {
                return false;
            }
        },
        availableAccounts() {
            switch (this.active) {
                case 'receive':
                    return this.accounts;
                case 'send': // Filter accounts based on the selected currency
                    const accounts = this.accounts.filter(account => {
                        // Check if account has balance for the selected currency
                        return account.balances.find(
                            balance =>
                                balance.asset_code === this.selectedCurrency &&
                                Number(balance.balance) > 0.1,
                        );
                    });
                    return accounts.sort(
                        (account, otherAccount) =>
                            account.position - otherAccount.position,
                    );
                default:
                    return [];
            }
        },
    },
    methods: {
        ...mapActions(['updateAccount', 'disableAccountEventStreams']),
        ...mapMutations(['startAppLoading', 'stopAppLoading']),
        scanQR() {
            window.vueInstance = this; //Don't remove this for flutter app
            const self = this;
            window.flutter_inappwebview
                .callHandler('SCAN_QR')
                .then(function(result) {
                    self.onDecode(result);
                });
        },
        onDecode(code) {
            var url = new URL(code);
            var tftAddress = url.hostname;
            var currency = url.protocol.match(/[a-zA-Z]+/g)[0];

            if (tftAddress === '') {
                tftAddress = url.pathname.replace('//', '');
            }
            const currencyIndex = this.currencies.findIndex(c => {
                return c.toLowerCase() == currency;
            });
            this.selectedCurrency = this.currencies[currencyIndex];
            this.formObject.to.address = tftAddress;
            this.formObject.amount =
                url.searchParams.get('amount') == 'null'
                    ? ''
                    : url.searchParams.get('amount');
            this.formObject.message =
                url.searchParams.get('message') == 'null'
                    ? ''
                    : url.searchParams.get('message');
            this.formObject.sender =
                url.searchParams.get('sender') == 'null'
                    ? ''
                    : url.searchParams.get('sender');
        },
        getQueryVar(url, varName) {
            var val;
            url = new URL(url);
            if (varName === 'HOST') {
                val = url.pathname.replace('//', '');
            } else {
                val = url.searchParams.get(varName);
            }
            return val;
        },
        transferConfirmed() {
            if (!this.checkForm()) {
                console.log('form not valid');
                return;
            }

            const ASSET_CODE = this.$refs.formComponent.selectedCurrency;
            const form = this.$refs.formComponent;
            const fromAccount = form.selectedAccount;
            const balance = Number(
                fromAccount.balances.find(b => b.asset_code === ASSET_CODE)
                    .balance,
            );
            const amountToTransfer = Number(form.formObject.amount);

            if (this.selectedTab && balance < amountToTransfer + this.fee) {
                this.$flashMessage.error('not enough funds');
                return;
            }

            if (this.active === 'receive') {
                this.qrDialog = true;
            } else if (this.active == 'send') {
                this.transactionInfoDialog = true;
            }
            // this.$refs.formComponent.$refs.form.inputs.forEach( input => input.blur() )
        },
        async send() {
            try {
                const fundedTransaction = await buildFundedPaymentTransaction(
                    this.selectedAccount.keyPair,
                    this.formObject.to.address,
                    new Number(this.formObject.amount),
                    this.formObject.message,
                    this.selectedCurrency,
                );

                await submitFundedTransaction(
                    fundedTransaction,
                    this.selectedAccount.keyPair,
                );

                this.$flashMessage.info(
                    `Successfully transferred ${this.formObject.amount | formatBalance} ${this.selectedCurrency} to ${this.formObject.to.address}.`,
                );
            } catch (e) {
                //@todo show correct error message for multiple errors eg: "reason": "invalid address"
                Logger.error('error Payment failed', { e });
                this.$flashMessage.error(`Payment failed: ${e.message}`);
            }

            this.$router.push({
                name: 'details',
                params: { account: this.selectedAccount.id },
            });
        },
        selectAccount(account) {
            this.selectedAccount = account;
        },
        checkForm() {
            return this.$refs.formComponent.$refs.form.validate();
        },
        async closeTransactionInfoDialog(save) {
            this.startAppLoading();
            if (save) await this.send();
            this.transactionInfoDialog = false;
            this.stopAppLoading();
        },
        closeQrScannerDialog() {
            this.qrScannerDialog = false;
        },
        closeQrDialog() {
            this.qrDialog = false;
        },
        balanceForCurrency(balances) {
            return balances.find(x => x.asset_code == this.selectedCurrency)
                .balance;
        },
    },
    watch: {},
};
