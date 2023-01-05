import axios from 'axios'

export function getSmartCity() {
    return axios.get('./data.json')
}