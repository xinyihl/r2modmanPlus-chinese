<script lang="ts" setup>
import { ref } from 'vue';
import SettingsViewWrapper from '../SettingsViewWrapper.vue';
import { useSettingSearch } from '../../composables/SettingSearchComposable';
import CdnProvider from '../../../providers/generic/connection/CdnProvider';

const props = defineProps<{
    searchTerm?: string;
}>();

const currentCdn = ref(CdnProvider.current);

const { isVisible } = useSettingSearch(() => props.searchTerm, () => [
    'Toggle preferred Thunderstore CDN',
    'CDN',
    currentCdn.value.label,
    currentCdn.value.url,
]);

function toggleCdn() {
    CdnProvider.togglePreferredCdn();
    currentCdn.value = CdnProvider.current;
}
</script>

<template>
    <SettingsViewWrapper v-show="isVisible">
        <template #title>切换首选 Thunderstore CDN</template>
        <template #description>
            <p>切换 CDN，直到应用重新启动。这可能会绕过下载模组时的问题。</p>
            <p>当前：{{ currentCdn.label }}<template v-if="currentCdn.url"> ({{ currentCdn.url }})</template>。</p>
        </template>
        <button class="button" @click="toggleCdn">切换首选 CDN</button>
    </SettingsViewWrapper>
</template>
