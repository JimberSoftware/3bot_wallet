import config from '../public/config';
import StellarSdk from 'stellar-sdk';
// let destinationId = 'GBTJEFDDMA5N4TDBFLJGA6K3MQFNHR2KUUFYAKYCOAEE43JD4CP3UTQC';
export const doTransaction = ({
  sourceKeyPair,
  destination,
  amount,
  message,
}) => {
  const server = new StellarSdk.Server(config.serverUrl);
  // Transaction will hold a built transaction we can resubmit if the result is unknown.
  let transaction;

  // First, check to make sure that the destination account exists.
  // You could skip this, but if the account does not exist, you will be charged
  // the transaction fee when the transaction fails.
  server
    .loadAccount(destination)
    // If the account is not found, surface a nicer error message for logging.
    .catch(function(error) {
      if (error instanceof StellarSdk.NotFoundError) {
        throw new Error('The destination account does not exist!');
      } else return error;
    })
    // If there was no error, load up-to-date information on your account.
    .then(function() {
      return server.loadAccount(sourceKeyPair.publicKey());
    })
    .then(function(sourceAccount) {
      // Start building the transaction.
      transaction = new StellarSdk.TransactionBuilder(sourceAccount, {
        // @Todo will each account need lumens in order to do transactions?
        fee: StellarSdk.BASE_FEE,
        networkPassphrase: StellarSdk.Networks.TESTNET,
      })
        .addOperation(
          StellarSdk.Operation.payment({
            destination: destination,
            // Because Stellar allows transaction in many currencies, you must
            // specify the asset type. The special "native" asset represents Lumens.
            // @Todo use tft asset?
            asset: StellarSdk.Asset.native(),
            amount,
          })
        )
        // A memo allows you to add your own metadata to a transaction. It's
        // optional and does not affect how Stellar treats the transaction.
        .addMemo(StellarSdk.Memo.text(message))
        // Wait a maximum of three minutes for the transaction
        .setTimeout(180)
        .build();
      // Sign the transaction to prove you are actually the person sending it.
      transaction.sign(sourceKeyPair);
      // And finally, send it off to Stellar!
      return server.submitTransaction(transaction);
    })
    .then(function(result) {
      console.log('Success! Results:', result);
    })
    .catch(function(error) {
      console.error('Something went wrong!', error);
      // If the result is unknown (no response body, timeout etc.) we simply resubmit
      // already built transaction:
      // server.submitTransaction(transaction);
    });
};

export const mapTransaction = async (rawTransaction) => {
  const operationsObj = await rawTransaction.operations()
  const operations = operationsObj.records
  // @Todo will there be more than one operation for our usecase?
  // Hardcoded for now 
  const operation = operations[0]

  const mappedTransaction = {
    successful: operation.successful,
    from: operation.from,
    to: operation.to,
    amount: operation.amount,
    asset_type: operation.asset_type,
    created_at: operation.created_at,
    type: operation.type
  }
  return mappedTransaction
}

export const fetchTransactions = async (id) => {
  const server = new StellarSdk.Server(config.serverUrl)
  const transactionObj = await server.transactions().forAccount(id).call()
  const rawTransactions = transactionObj.records

  const mappedTransactions = await Promise.all( rawTransactions.map(t => mapTransaction(t)))
  return mappedTransactions
}