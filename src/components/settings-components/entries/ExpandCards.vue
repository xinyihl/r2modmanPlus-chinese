<script lang="ts" setup>
import { onMounted, ref } from 'vue';
import { getStore } from '../../../providers/generic/store/StoreProvider';
import { State } from '../../../store';
import ManagerSettings from '../../../r2mm/manager/ManagerSettings';
import SettingsViewWrapper from '../SettingsViewWrapper.vue';
import { useSettingSearch } from '../../composables/SettingSearchComposable';

const store = getStore<State>();

const props = defineProps<{
    searchTerm?: string;
}>();

const settings = ref<ManagerSettings | null>(null);
const expandedCards = ref<boolean>(false);

const { isVisible } = useSettingSearch(() => props.searchTerm, [
    'Expand cards by default',
    'Toggle',
    'Collapsed',
    'Expanded',
]);

onMounted(async () => {
    settings.value = await ManagerSettings.getSingleton(store.state.activeGame);
    expandedCards.value = settings.value.getContext().global.expandedCards;
});

async function setExpanded(expanded: boolean) {
    expandedCards.value = expanded;
    if (expanded) {
        await settings.value?.expandCards();
    } else {
        await settings.value?.collapseCards();
    }
}
</script>

<template>
    <SettingsViewWrapper v-show="isVisible">
        <template #title>默认展开卡片</template>
        <template #description>
            打开模组列表时，显示完全展开的模组卡片，而不是折叠状态。
        </template>
        <div class="field" @click.prevent.stop="setExpanded(!expandedCards)">
            <input
                id="switch-expand-cards"
                type="checkbox"
                :class="['switch', { 'is-info': expandedCards }]"
                :checked="expandedCards"
            />
            <label for="switch-expand-cards">{{ expandedCards ? '展开' : '折叠' }}</label>
        </div>
    </SettingsViewWrapper>
</template>
