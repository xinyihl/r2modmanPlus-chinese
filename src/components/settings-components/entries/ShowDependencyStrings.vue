<script lang="ts" setup>
import { computed } from 'vue';
import { getStore } from '../../../providers/generic/store/StoreProvider';
import { State } from '../../../store';
import SettingsViewWrapper from '../SettingsViewWrapper.vue';
import { useSettingSearch } from '../../composables/SettingSearchComposable';

const store = getStore<State>();

const props = defineProps<{
    searchTerm?: string;
}>();

const modCount = computed<number>(() => store.state.profile.modList.length);

const { isVisible } = useSettingSearch(() => props.searchTerm, [
    'Show dependency strings',
    'Dependency',
]);

function showDependencyStrings() {
    store.commit('openDependencyStringsModal');
}
</script>

<template>
    <SettingsViewWrapper v-show="isVisible">
        <template #title>显示依赖字符串</template>
        <template #description>
            查看已安装模组及其版本字符串的列表，与 manifest.json 文件的 dependencies 数组中使用的格式相同。
            显示 {{ modCount }} 个模组的依赖字符串。
        </template>
        <button class="button" @click="showDependencyStrings">显示依赖字符串</button>
    </SettingsViewWrapper>
</template>
