<script lang="ts" setup>
import CategorySelectorModal from '../../components/modals/CategorySelectorModal.vue';
import ModalCard from '../../components/ModalCard.vue';
import { computed } from 'vue';
import { getStore } from '../../providers/generic/store/StoreProvider';
import { State } from '../../store';

const store = getStore<State>();

const allowNsfw = computed({
    get() {
        return store.state.modFilters.allowNsfw;
    },
    set(value) {
        store.commit("modFilters/setAllowNsfw", value)
    }
});

const showDeprecatedPackages = computed({
    get() {
        return store.state.modFilters.showDeprecatedPackages;
    },
    set(value) {
        store.commit("modFilters/setShowDeprecatedPackages", value)
    }
});

function close() {
    store.commit("closeCategoryFilterModal");
}

const isDarkTheme = computed(() => store.getters["settings"].getContext().global.darkTheme);
const isOpen = computed(() => store.state.modals.isCategoryFilterModalOpen);

function selectCompareOneCategory(event: Event) {
    if (!(event.target instanceof HTMLSelectElement)) {
        return;
    }

    store.commit("modFilters/selectCategoryToCompareOne", event.target.value);
    event.target.selectedIndex = 0;
}

function selectCompareAllCategory(event: Event) {
    if (!(event.target instanceof HTMLSelectElement)) {
        return;
    }

    store.commit("modFilters/selectCategoryToCompareAll", event.target.value);
    event.target.selectedIndex = 0;
}

function selectToExcludeCategory(event: Event) {
    if (!(event.target instanceof HTMLSelectElement)) {
        return;
    }

    store.commit("modFilters/selectCategoryToExclude", event.target.value);
    event.target.selectedIndex = 0;
}

const selectedCategoriesCompareOne = computed(() => store.state.modFilters.selectedCategoriesCompareOne);

const selectedCategoriesCompareAll = computed(() => store.state.modFilters.selectedCategoriesCompareAll);

const selectedCategoriesToExclude = computed(() => store.state.modFilters.selectedCategoriesToExclude);

function unselectCategory(category: string) {
    store.commit("modFilters/unselectCategory", category);
}

const unselectedCategories = computed(() => store.getters["modFilters/unselectedCategories"]);
</script>

<template>
    <ModalCard id="mod-category-filter-modal" v-show="isOpen" :is-active="isOpen" :can-close="false">
        <template v-slot:header>
            <h2 class="modal-title">按模组分类过滤</h2>
        </template>
        <template v-slot:body>
            <div>
                <CategorySelectorModal
                    title="模组必须至少包含这些分类之一"
                    :selected-categories="selectedCategoriesCompareOne"
                    :selectable-categories="unselectedCategories"
                    @selected-category="selectCompareOneCategory"
                    @deselected-category="unselectCategory"
                />
                <hr/>
                <CategorySelectorModal
                    title="模组必须包含所有这些分类"
                    :selected-categories="selectedCategoriesCompareAll"
                    :selectable-categories="unselectedCategories"
                    @selected-category="selectCompareAllCategory"
                    @deselected-category="unselectCategory"
                />
                <hr/>
                <CategorySelectorModal
                    title="模组不包含这些分类中的任何一个"
                    :selected-categories="selectedCategoriesToExclude"
                    :selectable-categories="unselectedCategories"
                    @selected-category="selectToExcludeCategory"
                    @deselected-category="unselectCategory"
                />
            </div>
            <hr/>
            <div>
                <div>
                    <input
                        v-model="allowNsfw"
                        id="nsfwCheckbox"
                        class="is-checkradio has-background-color"
                        type="checkbox"
                        :class="[{'is-dark': !isDarkTheme, 'is-white': isDarkTheme}]"
                    >
                    <label for="nsfwCheckbox">允许 NSFW（色情暴露）模组</label>
                </div>
                <div>
                    <input
                        v-model="showDeprecatedPackages"
                        id="showDeprecatedCheckbox"
                        class="is-checkradio has-background-color"
                        type="checkbox"
                        :class="[{'is-dark': !isDarkTheme, 'is-white': isDarkTheme}]"
                    >
                    <label for="showDeprecatedCheckbox">显示弃用的模组</label>
                </div>
            </div>
        </template>
        <template v-slot:footer>
            <button class="button is-info" @click="close">
                应用
            </button>
        </template>
    </ModalCard>
</template>
