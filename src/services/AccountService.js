import { keypairFromAccount } from "@jimber/stellar-crypto/dist/service/cryptoService";
import {
  loadAcount,
  generateAccount
} from "@jimber/stellar-crypto/dist/service/stellarService";
import { mnemonicToEntropy } from "bip39";

export const mapAccount = async ({
  accountResponse,
  name,
  tags,
  index,
  position,
  seed
}) => ({
  name: name,
  tags: tags,
  id: accountResponse.id,
  balances: accountResponse.balances,
  transactions: await accountResponse.transactions(),
  index,
  position,
  seed
});

export const fetchAccount = async ({ seed, index, name, tags, position }) => {
  const keyPair = keypairFromAccount(seed, index);
  let accountResponse;
  try {
    accountResponse = await loadAcount(keyPair);
  } catch (e) {
    if (e.message !== "Not Found") {
      throw Error("Something went wrong while fetching account");
    }
    accountResponse = await generateAndFetchAccount(keyPair);
  }
  return mapAccount({
    accountResponse,
    index,
    tags,
    name,
    position,
    seed: Buffer.from(mnemonicToEntropy(seedPhrase), 'hex')
  });
};
async function generateAndFetchAccount(keyPair) {
  try {
    await generateAccount(keyPair);
    return await loadAcount(keyPair);
  } catch (e) {
    throw Error("Something went wrong while generating account");
  }
}
