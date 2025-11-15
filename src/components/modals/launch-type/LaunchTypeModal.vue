<script setup lang="ts">
import ModalCard from '../../ModalCard.vue';
import {LaunchTypeModalOpen} from "../../../components/modals/launch-type/LaunchTypeRefs";
import {computed, ref, watchEffect} from "vue";
import Game from "../../../model/game/Game";
import {getStore} from "../../../providers/generic/store/StoreProvider";
import {State} from "../../../store";
import {getLaunchType, LaunchType} from "../../../model/real_enums/launch/LaunchType";
import {areWrapperArgumentsProvided, getDeterminedLaunchType, getWrapperLaunchArgs} from "../../../utils/LaunchUtils";
import CopyToClipboardButton from "../../buttons/CopyToClipboardButton.vue";
import ManagerSettings from "../../../r2mm/manager/ManagerSettings";

const store = getStore<State>();

const activeGame = computed<Game>(() => store.state.activeGame);
const launchOption = ref<LaunchType>(LaunchType.AUTO);
const determinedLaunchType = ref<LaunchType>(LaunchType.AUTO);
const wrapperProvided = ref<boolean>(false);

const launchArgs = ref<string>("");
getWrapperLaunchArgs().then(value => launchArgs.value = value);

watchEffect(async () => {
    determinedLaunchType.value = await getDeterminedLaunchType(activeGame.value, launchOption.value);
    wrapperProvided.value = await areWrapperArgumentsProvided(activeGame.value);
})

getLaunchType(activeGame.value)
    .then(launchType => launchOption.value = launchType);

function closeModal() {
  LaunchTypeModalOpen.value = false;
}

async function updateAndClose() {
  console.debug(
      "Updating launch type for game.",
      `Active game in Vuex: "${store.state.activeGame.settingsIdentifier}".`,
      `Active game in local ref: "${activeGame.value.settingsIdentifier}".`,
  );
  const settings = await ManagerSettings.getSingleton(activeGame.value);
  settings.logActiveGameInDexieStore();
  await settings.setLaunchType(launchOption.value);
  closeModal();
}

</script>

<template>
    <ModalCard id="launch-type-modal" v-show="LaunchTypeModalOpen" :is-active="LaunchTypeModalOpen" :can-close="true" @close-modal="closeModal">
        <template v-slot:header>
            <h2 class="modal-title">设置启动行为</h2>
        </template>
        <template v-slot:body>
          <div>
              <input id="launch-type-option-auto" type="radio" name="launch-type-option" :value="LaunchType.AUTO" v-model="launchOption"/>
              <label for="launch-type-option-auto"><span class="margin-right margin-right--half-width"/>自动</label>
          </div>
          <div>
              <input id="launch-type-option-native" type="radio" name="launch-type-option" :value="LaunchType.NATIVE" v-model="launchOption"/>
              <label for="launch-type-option-native"><span class="margin-right margin-right--half-width"/>原生</label>
          </div>
          <div>
              <input id="launch-type-option-proton" type="radio" name="launch-type-option" :value="LaunchType.PROTON" v-model="launchOption"/>
              <label for="launch-type-option-proton"><span class="margin-right margin-right--half-width"/>Proton</label>
          </div>
          <p v-if="launchOption === LaunchType.AUTO" class="margin-top">
              通过选择<strong>自动</strong>，{{ activeGame.displayName }}将在<strong class="tag">{{ determinedLaunchType }}</strong>模式下启动。
          </p>
          <div v-if="determinedLaunchType === LaunchType.NATIVE && !wrapperProvided" class="margin-top">
            <p>
              无法确定所需的参数是否已设置。
            </p>
            <p>
              如果你尚未手动执行此操作，请将以下启动参数添加到 Steam 的游戏属性中：
            </p>
            <div>
              <code>
                {{ launchArgs }}
              </code>
            </div>
            <div class="margin-top">
              <CopyToClipboardButton :copy-value="launchArgs" id="launch-type-modal-copy-button">
                复制启动参数
              </CopyToClipboardButton>
            </div>
          </div>
        </template>
        <template v-slot:footer>
            <button id="launch-type-modal-update-button" class="button is-info" @click="updateAndClose">
                更新
            </button>
        </template>
    </ModalCard>
</template>
