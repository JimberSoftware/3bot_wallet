import Vue from 'vue';
import Vuetify, {
  VSnackbar,
  VBtn,
  VIcon,
  VProgressCircular,
  VDivider,
  VContainer,
  VRow,
  VCol,
  VCard,
  VCardTitle,
  VSkeletonLoader,
} from 'vuetify/lib';
import VuetifyToast from 'vuetify-toast-snackbar';

Vue.use(Vuetify, {
  components: {
    VSnackbar,
    VBtn,
    VIcon,
    VProgressCircular,
    VDivider,
    VContainer,
    VRow,
    VCol,
    VCard,
    VCardTitle,
    VSkeletonLoader,
  },
});

Vue.use(VuetifyToast, {
  queueable: true,
  showClose: true,
  closeIcon: 'fa-times',
  property: '$flashMessage',
});

export default new Vuetify({
  iconfont: 'fa',
  theme: {
    themes: {
      light: {
        primary: '#2d4052',
        accent: '#1abc9c',
        gold: '#dea600',
        error: '#CE796B',
      },
    },
  },
});
