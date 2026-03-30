<template>
    <div id="setup-body">
		<Hero :title="`Getting started on ${platformName}`" subtitle="让我们正确配置游戏" heroType="primary" />
		<br/>
        <div class="container margin-bottom" v-if="alreadyHadValuesSet && isFlatpak">
            <div class="notification is-warning">
                <p>您似乎已设置过启动参数。</p>
                <p>{{ appName }} 的 Flatpak 版本现采用不同的封装脚本。</p>
                <p>您必须更新启动参数以支持此变更。</p>
            </div>
        </div>
		<div class="container">
			要在 Linux 上启动{{ activeGame.displayName }}，你必须首先正确设置你的 Steam 启动选项。<br/>
            这是因为 BepInEx 在 Unix 系统上的注入方式所致。<br/>
			<br/>
			请将以下内容复制并粘贴到你的{{ activeGame.displayName }}启动选项中：<br/>
			<code id="copyableArgs">{{ finalArgs }}</code>
			<br/>
			<br/>
			<a id="copy-action" class="button margin-right margin-right--half-width" @click="copy">复制到剪贴板</a>
			<a class="button is-info" @click="acknowledge">继续</a>
		</div>
	</div>
</template>

<script lang='ts' setup>
import {Hero} from '../components/all';
import {computed, ref} from 'vue';
import {getStore} from '../providers/generic/store/StoreProvider';
import {State} from '../store';
import {useRouter} from 'vue-router';
import {ComputedWrapperLaunchArguments, WineDllOverridesValue} from '../components/computed/WrapperArguments';
import InteractionProviderImpl from '../r2mm/system/InteractionProviderImpl';
import appWindow from '../providers/node/app/app_window';
import {
    areAnyWrapperArgumentsProvided,
    isManagerRunningOnFlatpak
} from '../utils/LaunchUtils';
import ManagerInformation from "../_managerinf/ManagerInformation";

const store = getStore<State>();
let router = useRouter();

const appName = computed(() => ManagerInformation.APP_NAME);
const activeGame = computed(() => store.state.activeGame);
const platformName = computed<string>(() => appWindow.getPlatform() === 'darwin' ? 'macOS' : appWindow.getPlatform());

const finalArgs = computed(() => {
    let result = '';
    if (WineDllOverridesValue.value) {
        result = `${WineDllOverridesValue.value} `;
    }
    return result + ComputedWrapperLaunchArguments.value;
});

const alreadyHadValuesSet = ref<boolean>(false);
areAnyWrapperArgumentsProvided(activeGame.value).then(value => alreadyHadValuesSet.value = value);

const isFlatpak = ref<boolean>(false);
isManagerRunningOnFlatpak().then(value => isFlatpak.value = value);

function copy(){
    let range = document.createRange();
    range.selectNode(document.getElementById('copyableArgs') as Node);
    const selection = window.getSelection();
    if(selection !== null) {
        selection.removeAllRanges();
        selection.addRange(range);
    }
    InteractionProviderImpl.instance.copyToClipboard(finalArgs.value);
    document.getElementById('copy-action')!.innerHTML = 'Copied!';
    setTimeout(() => {
        const element = document.getElementById('copy-action');
        if (element) {
            element.innerHTML = 'Copy to clipboard';
        }
    }, 2000);
}

async function acknowledge(){
    router.push({path: "/profiles"});
}
</script>

<style lang="scss" scoped>
#setup-body {
    display: flex;
    flex-direction: column;
    flex: 1;
    overflow-y: auto;
}
</style>
