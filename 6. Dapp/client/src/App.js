import React, {useEffect} from 'react';
import Main from './pages/Main'
import web3 from "./helpers/web3";
import {loadContract} from "./helpers/contract";
import walletStore from "./stores/wallet";
import './assets/css/normalize.css';
import './assets/css/app.css';
import {connect, disconnect} from "./helpers/wallet";

function App() {
  useEffect(() => {
    web3(async () => {
      await disconnect();
      await connect();
    }).then(async (web3Provider) => {
      walletStore.setState({ web3: web3Provider, ready: true });

      // Load the contract
      await loadContract(web3Provider);

      await connect();
    });
  }, []);

  return <Main />;
}
export default App;
