<template>
	<div>
		<Hero :title="`Getting started on ${platformName}`" subtitle="Let's configure the game properly" heroType="warning" />
		<br/>
		<div class="container">
			要在 Linux 上启动{{ activeGame }}，你必须首先正确设置你的 Steam 启动选项。<br/>
            这是因为 BepInEx 在 Unix 系统上的注入方式所致。<br/>
			<br/>
			请将以下内容复制并粘贴到你的{{ activeGame }}启动选项中：<br/>
			<code id="copyableArgs">{{ ComputedWrapperLaunchArguments }}</code>
			<br/>
			<br/>
			<a id="copy-action" class="button margin-right margin-right--half-width" @click="copy">复制到剪贴板</a>
			<a class="button is-info" @click="acknowledge">继续</a>
		</div>
	</div>
</template>

<script lang='ts' setup>
import { Hero } from '../components/all';
import { computed, getCurrentInstance, onMounted, ref } from 'vue';
import { getStore } from '../providers/generic/store/StoreProvider';
import { State } from '../store';
import VueRouter, {useRouter} from 'vue-router';
import {ComputedWrapperLaunchArguments} from "../components/computed/WrapperArguments";
import InteractionProviderImpl from "../r2mm/system/InteractionProviderImpl";
import appWindow from '../providers/node/app/app_window';

const store = getStore<State>();
let router = useRouter();

const activeGame = computed(() => store.state.activeGame.displayName);
const platformName = computed<string>(() => appWindow.getPlatform() === 'darwin' ? 'macOS' : appWindow.getPlatform());

function copy(){
    let range = document.createRange();
    range.selectNode(document.getElementById('copyableArgs') as Node);
    const selection = window.getSelection();
    if(selection !== null) {
        selection.removeAllRanges();
        selection.addRange(range);
    }
    InteractionProviderImpl.instance.copyToClipboard(ComputedWrapperLaunchArguments.value);
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
