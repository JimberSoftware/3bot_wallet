import Balance from '../Balance';
import { mapGetters, mapActions } from 'vuex';
import router from '../../router';

export default {
    name: 'account-card',
    components: { Balance },
    props: {
        account: {
            type: Object,
        },
        clickable: {
            type: Boolean,
        },
        selected: {
            type: Boolean,
        },
        displayAttributes: {
            type: Boolean,
            default: true,
        },
        displayAmount: {
            type: Boolean,
            default: true,
        },
    },
    data() {
        return {
            amount: '---',
        };
    },
    computed: {
        ...mapGetters(['accounts', 'threeBotName']),
        getHumanWalletAddress() {
            return `${this.account.name.replace(/\s/g, '')}@${
                this.threeBotName
            }`;
        },
    },
    mounted() {},
    methods: {
        copyAddress() {
            this.$root.$emit('copy', {
                title: 'Copy wallet address to clipboard',
                toCopy: this.account.id,
                callback: () => {
                    this.$flashMessage.info(
                        `Address has been copied to clipboard (${this.account.id.substring(
                            0,
                            8
                        )}...).`
                    );
                },
            });
        },
        clicked() {
            if (this.clickable) {
                router.push({
                    name: 'details',
                    params: {
                        account: this.account.name,
                    },
                });
            }
        },
    },
};
