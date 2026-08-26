<script lang="ts" setup>
import { getStore } from '../../../providers/generic/store/StoreProvider';
import { State } from '../../../store';
import SettingsViewWrapper from '../SettingsViewWrapper.vue';
import { useSettingSearch } from '../../composables/SettingSearchComposable';

const store = getStore<State>();

const props = defineProps<{
    searchTerm?: string;
}>();

const { isVisible } = useSettingSearch(() => props.searchTerm, [
    'Set custom launch arguments',
    'Launch parameters',
]);

function openLaunchArguments() {
    store.commit('openLaunchArgumentsModal');
}
</script>

<template>
    <SettingsViewWrapper v-show="isVisible">
        <template #title>启动参数</template>
        <template #description>
            提供启动游戏时附加的自定义参数。
        </template>
        <button class="button" @click="openLaunchArguments">设置启动参数</button>
    </SettingsViewWrapper>
</template>
