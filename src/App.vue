<script setup lang="ts">
import axios from "axios";
import { ref, reactive, onMounted, computed } from "vue"
import FilterDropDownButton from './components/FilterDropDownButton.vue';

const DEFAULT_ENV = "All Environments";
const DEFAULT_COUNTRY = "All Countries";

const initialEnviromentsDropdownProps = {
  icon: "ti-settings",
  color: "light",
  event: "chooseEnv",
  defaultVal: DEFAULT_ENV,
  currentFilter: DEFAULT_ENV,
  filtersOptions: ["int"]
}

const initialCountiresDropdownProps = {
  icon: "ti-world",
  color: "light",
  event: "chooseCountry",
  defaultVal: DEFAULT_COUNTRY,
  currentFilter: DEFAULT_COUNTRY,
  filtersOptions: ["ita"]
}

const enviromentsDropdownProps = reactive(initialEnviromentsDropdownProps)
const countiresDropdownProps = reactive(initialCountiresDropdownProps)
const listOfReportSummaries = ref<ReportSummaryProps[] | []>([])
const currentModalData = ref<ReportSummaryProps | null>(null)
const deleteErrorMessage = ref("")
const isLoading = ref(false)

onMounted(async () => {
  listOfReportSummaries.value = await fetchReportSummartiesApi()
  calculateDropdownfilterOptions()
})

// runs when its reactive dependencies are changed
const filteredListOfReports = computed(() => {
  const selectedEnvironment = enviromentsDropdownProps.currentFilter
  const selectedCountry = countiresDropdownProps.currentFilter

  return listOfReportSummaries.value
    .filter((report: ReportSummaryProps) => {
      const matchEnv = selectedEnvironment === DEFAULT_ENV || report.environment === selectedEnvironment
      const matchCountry = selectedCountry === DEFAULT_COUNTRY || report.country === selectedCountry
      return matchEnv && matchCountry
    })
    .sort((reportA, reportB) => {
      const stampA = reportA.reportId.replace(/[^0-9]/g, '')
      const stampB = reportB.reportId.replace(/[^0-9]/g, '')
      return parseInt(stampB) - parseInt(stampA)
    })
})

function calculateDropdownfilterOptions() {
  const envSet = new Set<string>([enviromentsDropdownProps.defaultVal])
  const countrySet = new Set<string>([countiresDropdownProps.defaultVal])

  listOfReportSummaries.value.forEach((reportSummary: ReportSummaryProps) => {
    envSet.add(reportSummary.environment)
    countrySet.add(reportSummary.country)
  })

  envSet.delete(enviromentsDropdownProps.currentFilter)
  countrySet.delete(countiresDropdownProps.currentFilter)

  enviromentsDropdownProps.filtersOptions = [...envSet]
  countiresDropdownProps.filtersOptions = [...countrySet]
}

function chooseEnv(chosenEnvironment: string) {
  enviromentsDropdownProps.currentFilter = chosenEnvironment
  calculateDropdownfilterOptions()
}

function chooseCountry(chosenCountry: string) {
  countiresDropdownProps.currentFilter = chosenCountry
  calculateDropdownfilterOptions()
}

function setCurrentModalData(newReportSummary: ReportSummaryProps) {
  currentModalData.value = newReportSummary
}

async function fetchReportSummartiesApi(): Promise<ReportSummaryProps[]> {
  try {
    const { data } = await axios.get("/api/reports");
    return data;
  } catch (e) {
    console.error(e);
    return [];
  }
}

async function deleteReportApi(reportSummary: ReportSummaryProps | null) {
  const reportId = reportSummary?.reportId
  isLoading.value = true
  try {
    const response = await axios.delete(`/api/reports/${reportId}`);
    if (response.status === 200) {
      isLoading.value = false
      deleteErrorMessage.value = ""
      listOfReportSummaries.value = await fetchReportSummartiesApi()
      // @ts-ignore
      document.querySelector('[data-bs-dismiss="modal"]')?.click()
    }
    return response.data;
  } catch (error) {
    isLoading.value = false
    deleteErrorMessage.value = "Error deleting the report."
    console.error("Error deleting the report:", error);
  }
}


</script>
<template>
  <div class="layout-wrapper layout-navbar-full layout-horizontal layout-without-menu">
    <div class="layout-container">
      <nav class="layout-navbar navbar navbar-expand-xl align-items-center bg-navbar-theme" id="layout-navbar">
        <div class="container-xxl">
          <div class="navbar-brand app-brand demo d-none d-xl-flex py-0 me-4">
            <a href="index.html" class="app-brand-link gap-2">
              <img class="d-block" src="./assets/logo-blue-93238485.svg" alt="logo" height="28px" width="28px">
              <span class="app-brand-text menu-text">e2e reports</span>
            </a>
          </div>
          <div>
          </div>
          <div class="d-flex">
            <FilterDropDownButton id="environments-filters" :props="enviromentsDropdownProps" @chooseEnv="chooseEnv" />
            <FilterDropDownButton id="country-filters" :props="countiresDropdownProps" @chooseCountry="chooseCountry" />
          </div>
        </div>
      </nav>
      <div class="layout-page">
        <div class="content-wrapper">
          <div class="container-xxl flex-grow-1 container-p-y">
            <div class="p-tableContainer">
              <div class="d-flex">
              </div>
              <div class="table-responsive">
                <table class="table">
                  <thead>
                    <tr>
                      <th>Id</th>
                      <th>Date</th>
                      <th>Country</th>
                      <th>Env</th>
                      <th>Time</th>
                      <th>Dur</th>
                      <th>Suites</th>
                      <th>Tests</th>
                      <th>Pass %</th>
                      <th>Delete</th>
                    </tr>
                  </thead>
                  <tbody class="table-border-bottom-0" id="list-of-reports">
                    <tr v-for="(reportSummary, index) in filteredListOfReports" :key="index">
                      <td>{{ index + 1 }}</td>
                      <td><a :href="`${reportSummary.dirLink}/margo-report.html`">{{ reportSummary.date }}</a></td>
                      <td>{{ reportSummary.country }}</td>
                      <td>{{ reportSummary.environment }}</td>
                      <td>{{ reportSummary.time }}</td>
                      <td>{{ reportSummary.duration }}</td>
                      <td>{{ reportSummary.suites }}</td>
                      <td>{{ reportSummary.tests }}</td>
                      <td>
                        <div class="progress custom-progress-bar">
                          <div class="progress-bar bg-success" role="progressbar"
                            :style="{ width: `${reportSummary.passRate}%` }" :aria-valuenow="reportSummary.passRate"
                            aria-valuemin="0" aria-valuemax="100">{{ reportSummary.passRate }}%</div>
                          <div class="progress-bar bg-danger" role="progressbar"
                            :style="{ width: `${100 - reportSummary.passRate}%` }" :aria-valuenow="reportSummary.passRate"
                            aria-valuemin="0" aria-valuemax="100"></div>
                        </div>
                      </td>
                      <td>
                        <!-- Button trigger modal -->
                        <button type="button" @click="setCurrentModalData(reportSummary)"
                          class=" btn btn-label-dark waves-effect waves-light" data-bs-toggle="modal"
                          data-bs-target="#modalCenter">
                          <i class="ti ti-trash"></i>
                        </button>

                        <!-- Modal -->
                        <div class="modal fade" id="modalCenter" tabindex="-1" style="display: none;" aria-hidden="true">
                          <div class="modal-dialog modal-dialog-centered" role="document">
                            <div class="modal-content">
                              <div class="modal-header">
                                <h5 class="modal-title" id="modalCenterTitle">Delete report?</h5>
                                <button type="button" class="btn-close" data-bs-dismiss="modal"
                                  aria-label="Close"></button>
                              </div>
                              <div class="modal-body">
                                <div class="row">
                                  <div class="col mb-3">
                                    <h6>
                                      Report
                                      <strong class="font-bold">
                                        {{
                                          `${currentModalData?.country}
                                                                                ${currentModalData?.environment}
                                                                                ${currentModalData?.date}
                                                                                ${currentModalData?.time} ` }}
                                      </strong>
                                      will be deleted permanently.
                                    </h6>
                                    <p class="text-danger">
                                      {{ deleteErrorMessage }}
                                    </p>
                                  </div>
                                </div>
                              </div>
                              <div class="modal-footer">
                                <button type="button" class="btn btn-label-secondary waves-effect" data-bs-dismiss="modal"
                                  ref="closeModalButton">Close</button>
                                <!-- TODO write error handling adn displaying and loading and close modal after delete with data-bs-dismiss modal -->
                                <button v-if="!isLoading" @click="deleteReportApi(currentModalData)" type="button"
                                  class="btn waves-effect btn-danger waves-light">Delete</button>
                                <button v-else class="btn btn-primary waves-effect waves-light" type="button" disabled>
                                  <span class="spinner-grow me-1" role="status" aria-hidden="true"></span>
                                  Loading...
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
          <div class="content-backdrop fade"></div>
        </div>
      </div>
      <footer class="content-footer footer bg-footer-theme">
        <div class="container-xxl">
          <div class="footer-container d-flex align-items-center justify-content-between py-2 flex-md-row flex-column">
            <div>
              ©
              {{ new Date().getFullYear() }}
              , made with ❤️ by your QA automation team
            </div>
          </div>
        </div>
      </footer>
    </div>
  </div>
</template>
<style scoped>
.custom-progress-bar {
  width: 400px;
}

img {
  width: auto !important;
  height: 28px !important;
}
</style>