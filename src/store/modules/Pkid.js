import config from '../../public/config';
import Pkid from '@jimber/pkid';
import sodium from 'libsodium-wrappers';

export default {
  state: {
    client: null,
    pkidApp: null,
    pkidImported: null,
  },
  actions: {
    async saveToPkid ({ getters, dispatch }) {
      const appAccounts = getters.accounts
        .filter(account => account.tags.includes('app'))
        .map(account => ({
          walletName: account.name,
          position: account.position,
          index: account.index,
          stellar: true,
        }));
      if (appAccounts.length <= 0) {
        console.log('not saved to pkid due to no accounts ');
        return;
      }
      const appPromise = dispatch('setPkidAppAccounts', appAccounts);
      const importedAccounts = getters.accounts
        .filter(account => account.tags.includes('imported'))
        .map(account => ({
          walletName: account.name,
          seed: account.seed,
          stellar: true,
        }));
      const importedPromise = dispatch(
        'setPkidImportedAccounts',
        importedAccounts
      );
      await Promise.all([appPromise, importedPromise]);
      console.log('saved to pkid');
    },
    async setPkidAppAccounts ({ getters }, accounts) {
      // wallets key for historic reasons
      await getters.client.setDoc('wallets', accounts, true);
    },
    async setPkidClient (context, seed) {
      // const keyPair = await generateKeypair(payload)
      await sodium.ready;

      const keyPair = sodium.crypto_sign_seed_keypair(seed);

      const client = new Pkid(config.pkidUrl, keyPair);
      console.log('client: ', client);
      context.commit('setPkidClient', client);
    },
    async getPkidAppAccounts (context) {
      const client = context.getters.client;
      const data = await client.getDoc(client.keyPair.publicKey, 'wallets');

      if (!data.success) {
        if (404 == data.status) {
          return null;
        }
        throw Error('something is wrong with Pkid connection');
      }
      context.commit('setPkidApp', data);

      return data.data;
    },
    setPkidImportedAccounts (context, accounts) {
      context.getters.client.setDoc('imported_accounts', accounts, true);
    },
    async getPkidImportedAccounts (context) {
      const client = context.getters.client;
      const data = await client.getDoc(
        client.keyPair.publicKey,
        'imported_accounts'
      );

      if (!data.success) {
        if (data.status === 404) {
          return null;
        }
        // @todo: handel this situation
        throw new Error();
      }
      context.commit('setPkidImported', data);
      return data.data;
    },
    async addImportedWallet (context, postMessage) {
      const wallets = await context.dispatch('getPkidImportedAccounts');
      await context.dispatch('setPkidImportedWallets', [
        ...wallets,
        postMessage,
      ]);
    },
    async updatePkidAccounts (context) {
      // @todo
    },
  },
  mutations: {
    setPkidClient (state, payload) {
      state.client = payload;
    },
    setPkidApp (state, pkidApp) {
      state.pkidApp = pkidApp;
    },
    setPkidImported (state, pkidImported) {
      state.pkidImported = pkidImported;
    },
  },
  getters: {
    client: state => state.client,
    pkidApp: state => state.pkidApp,
    pkidImported: state => state.pkidImported,
  },
};