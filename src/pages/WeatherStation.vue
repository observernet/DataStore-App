<script setup>
import { ref } from 'vue'
import { useStore } from "@/store"
import { useI18n } from 'vue-i18n'
import comm from '@/comm'
import utils, { toast }  from "@/utils"

const store = useStore();
const { t } = useI18n();

const input_title = ref('');
const input_body = ref(t('ws.content.input.body_placeholder'));
const input_email = ref('');


function isActiveButton() {
    if ( input_title.value.length <= 5 ) return false;
    if ( input_body.value.length <= 30 ) return false;
    if ( !utils.isValidEmail(input_email.value) ) return false;

    return true;
}

let isRequesting = false;
async function onClickRequest() {
    if ( isRequesting ) return;
    if ( !isActiveButton() ) return;

    try {
        isRequesting = true;
        const result = await comm.RequestPOST(store.lang, "/request", {
            type: 'WS',
            title: input_title.value,
            body: input_body.value,
            email: input_email.value,
        });
        
        input_title.value = '';
        input_body.value = t('ws.content.input.body_placeholder');
        input_email.value = '';

        toast.info(t('ws.content.input.complete'));

    } catch (err) {
        console.error("onClickRequest error:", err);
        toast.error(err.error.message);
    } finally {
        isRequesting = false;
    }
}
</script>

<template>
    <div class="wws">
        <div class="title">{{ $t('ws.title') }}</div>
		<div class="body">
			<div class="content">
                <h3>{{ $t('ws.content.title') }}</h3>
				<ul>
                    <li>
						<label>{{ $t('ws.content.input.title') }}</label>
						<input v-model="input_title" type="text" :placeholder="$t('ws.content.input.title_placeholder')">
					</li>
					<li>
						<label>{{ $t('ws.content.input.body') }}</label>
                        <textarea v-model="input_body"></textarea>
					</li>
                    <li>
						<label>{{ $t('ws.content.input.email') }}</label>
						<input v-model="input_email" type="text" :placeholder="$t('ws.content.input.email_placeholder')">
					</li>
				</ul>
                <button :class="{hover: isActiveButton()}" @click="onClickRequest()">{{ $t('ws.content.input.request') }}</button>
            </div>
		</div>
    </div>
</template>

<style scoped>
.wws { position: relative; height: 100%; display: flex; flex-direction: column; }
.wws .title { padding: 15px; border-bottom: 0.5px solid #DBE4EB; font-size: 20px; font-weight: 700; background: #FFF; }
.wws .body { flex: 1; display: flex; min-height: 0; overflow-y: auto; }

.wws .body .content { position: relative; margin: 24px auto; padding: 24px 16px; background: #FFF; border-radius: 8px; width: 100%; max-width: 950px; align-self: flex-start; }
.wws .body .content h3 { margin-bottom: 16px; }
.wws .body .content ul { list-style: none; }
.wws .body .content ul li { display: flex; border-bottom: 1px solid #DBE4EB; padding: 12px 0; }
.wws .body .content ul li label { display: block; font-size: 14px; font-weight: 700; color: #40484E; width: 100px; padding-top: 4px; }
.wws .body .content ul li input { width: 100%; padding: 4px 8px; }
.wws .body .content ul li textarea { width: 100%; height: 300px; padding: 8px; }
.wws .body .content ul li:not(.chips li):last-child { border-bottom: none; }

.wws .body .content button { margin-top: 24px; padding: 12px 48px; float: right; }
</style>