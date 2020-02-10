import config from "../../public/config";
import Pkid from "@jimber/pkid";
import sodium from "libsodium-wrappers";

export default {
  state: {
    client: null
  },
  actions: {
    async setPkidClient(context, seed) {
      // const keyPair = await generateKeypair(payload)
      await sodium.ready;

      const keyPair = sodium.crypto_sign_seed_keypair(seed);

      const client = new Pkid(config.pkidUrl, keyPair);
      console.log("client: ", client);
      context.commit("setPkidClient", client);
    },
    async getPkidAppAccounts(context) {
      const client = context.getters.client;
      const data = await client.getDoc(client.keyPair.publicKey, "wallets");
      console.log("data", data);
      if (!data.success) {
        if (404 == data.status) {
          return null;
        }
        throw Error("something is wrong with Pkid connection");
      }
      return data.data;
    },
    setPkidAccounts(context, accounts) {
      context.getters.client.setDoc("wallets", accounts, true);
    },
    setPkidImportedAccounts(context, accounts) {
      context.getters.client.setDoc("imported_accounts", accounts, true);
    },
    async getPkidImportedAccounts(context) {
      const client = context.getters.client;
      const data = await client.getDoc(
        client.keyPair.publicKey,
        "imported_accounts"
      );
      if (!data.success) {
        if (data.status === 404) {
          return null;
        }
        // @todo: handel this situation
        throw new Error();
      }
      return data.data;
    },
    async addImportedWallet(context, postMessage) {
      const wallets = await context.dispatch("getPkidImportedAccounts");
      await context.dispatch("setPkidImportedWallets", [
        ...wallets,
        postMessage
      ]);
    },
    async updatePkidAccounts(context) {
      // @todo
    }
  },
  mutations: {
    setPkidClient(state, payload) {
      state.client = payload;
    }
  },
  getters: {
    client: state => state.client
  }
};