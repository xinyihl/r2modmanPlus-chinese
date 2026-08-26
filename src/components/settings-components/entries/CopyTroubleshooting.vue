<script lang="ts" setup>
import { ref } from 'vue';
import { getStore } from '../../../providers/generic/store/StoreProvider';
import { State } from '../../../store';
import SettingsViewWrapper from '../SettingsViewWrapper.vue';
import { useSettingSearch } from '../../composables/SettingSearchComposable';
import InteractionProvider from '../../../providers/ror2/system/InteractionProvider';
import R2Error from '../../../model/errors/R2Error';

const store = getStore<State>();

const props = defineProps<{
    searchTerm?: string;
}>();

const isCopying = ref<boolean>(false);

const { isVisible } = useSettingSearch(() => props.searchTerm, [
    'Copy troubleshooting information to clipboard',
    'Discord',
    'support',
]);

async function copyTroubleshootingInfoToClipboard() {
    isCopying.value = true;
    try {
        const content = await store.dispatch('profile/generateTroubleshootingString');
        InteractionProvider.instance.copyToClipboard('```' + content + '```');
    } catch (e) {
        store.commit('error/handleError', R2Error.fromThrownValue(e, 'Failed to copy troubleshooting information'));
    } finally {
        isCopying.value = false;
    }
}
</script>

<template>
    <SettingsViewWrapper v-show="isVisible">
        <template #title>复制故障排查信息到剪贴板</template>
        <template #description>
            将设置和其他信息复制到剪贴板，并格式化为 Discord 可用的格式。在寻求支持时分享这些信息。
        </template>
        <button
            class="button"
            :class="{ 'is-loading': isCopying }"
            :disabled="isCopying"
            @click="copyTroubleshootingInfoToClipboard"
        >
            复制故障排查信息到剪贴板
        </button>
    </SettingsViewWrapper>
</template>
