<script setup>
import { ref, onMounted, onUnmounted } from "vue";
import { useStore } from "@/store";
import { useRouter } from "vue-router";


const store = useStore();
const router = useRouter();

const account = ref(null);
const chainId = ref(null);
const terms = ref({terms: false});


function isAllChecked() {
	return Object.values(terms.value).every(v => v === true);
}

function onClickNext() {
	var allchecked = isAllChecked();

	if ( allchecked ) {
		store.login({account: account.value, chainId: chainId.value});
		router.push("/store");
	} else {
		Object.keys(terms.value).forEach(key => {
		terms.value[key] = true;
		});
	}
}

async function connectWallet() {
  	if ( typeof window.ethereum === "undefined" ) {
    	alert("MetaMask를 설치해주세요!");
    	return;
  	}

  	try {
    	const accounts = await window.ethereum.request({method: "eth_requestAccounts"});
    	account.value = accounts[0];
		console.log('connectWallet', account.value);

		chainId.value = await window.ethereum.request({ method: 'eth_chainId' });
		if ( chainId.value !== store.network.chainId ) {
			await switchNetwork();
		}
  	} catch (err) {
    	console.error(err);
  	}
}

async function switchNetwork() {
  	try {
    	await window.ethereum.request({method: 'wallet_switchEthereumChain', params: [{ chainId: store.network.chainId }]});
    	chainId.value = store.network.chainId;
  	} catch (err) {
    	if ( err.code === 4902 ) {
      		await window.ethereum.request({
        		method: 'wallet_addEthereumChain',
        		params: [{
          			chainId: store.network.chainId,
          			chainName: store.network.name,
          			rpcUrls: [store.network.rpc],
          			blockExplorerUrls: [store.network.explorer],
					nativeCurrency: {
						name: store.network.symbol,
						symbol: store.network.symbol,
						decimals: 18
					}
        		}],
      		});
    	} else {
      		console.error(err);
    	}
  	}
}
</script>

<template>
    <div class="wlogin">
      	<div class="card" v-if="account == null">
			<div>
				<img src="@/assets/images/logo-full.svg" />
				<h1>{{ $t('login.title') }}</h1>
			</div>
			<button class="metamask" @click="connectWallet()">
				<img src="@/assets/images/metamask.svg" width="24" height="24" />
				{{ $t('login.button') }}
			</button>
		</div>
		<div class="card" v-else>
			<div>
				<img src="@/assets/images/logo-full.svg" />
				<h1>{{ $t('terms.title') }}</h1>
				<p>{{ $t('terms.desc') }}</p>
			</div>
			<ul>
				<li :class="{hover: terms.terms}" @click="terms.terms = !terms.terms">
					<div class="content">
						<img v-if="terms.terms" src="@/assets/images/check_good.svg" width="24" height="24" />
						<img v-else src="@/assets/images/check_none.svg" width="24" height="24" />
						<div class="data">
							<strong>{{ $t('terms.essential') }}</strong>
							{{ $t('terms.terms') }}
						</div>
					</div>
					<div class="after">{{ $t('terms.detail') }}</div>
				</li>
			</ul>
			<button class="hover" style="padding: 14px 20px" @click="onClickNext()">
				<template v-if="isAllChecked()">
					<span style="display: block; height: 24px;"></span>
					{{ $t('terms.next') }}
				</template>
				<template v-else>
					<img src="@/assets/images/check_good.svg" width="24" height="24" />
					{{ $t('terms.agree') }}
				</template>
			</button>
		</div>
    </div>
</template>

<style scoped>
.wlogin { position: absolute; top: 0; left: 0; right: 0; height: 100%; display: flex; justify-content: center; align-items: center; }
.wlogin .card { display: flex; flex-direction: column; justify-content: space-between; width: 400px; min-height: 170px; }
.wlogin button.metamask { padding: 14px 20px; font-size: 16px; background: #E5EBF0; color: #22262A; }
.wlogin p { font-size: 16px; font-weight: 500; }
.wlogin h1 { margin-bottom: 8px; }
.wlogin ul { list-style: none; margin: 60px 0; }
.wlogin li { display: flex; justify-content: space-between; align-items: center; border: 1px solid #DBE4EB; padding: 12px 16px; border-radius: 12px; cursor: pointer; }
.wlogin li .content { display: flex; align-items: center; }
.wlogin li .content .data { font-size: 16px; font-weight: 500; padding-left: 8px; }
.wlogin li .content .data strong { display: block; font-size: 12px; font-weight: 500; color: #0098E3; padding-bottom: 6px; }
.wlogin li .after { font-size: 14px; font-weight: 500; color: #40484E; text-decoration: underline; }
.wlogin li.hover { background: #F5F7FA; }


</style>