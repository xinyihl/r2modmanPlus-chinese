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
    'Import local mod',
    'Install offline',
    'Import'
]);

function importLocalMod() {
    store.commit('openLocalFileImportModal');
}
</script>

<template>
    <SettingsViewWrapper v-show="isVisible">
        <template #title>导入本地模组</template>
        <template #description>
            从你的文件离线安装模组。并非所有模组都可以本地安装。
        </template>
        <button class="button" @click="importLocalMod">导入本地模组</button>
    </SettingsViewWrapper>
</template>
