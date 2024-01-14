function getCustomizedDate(params) {
    return params.date.getFullYear() + '-' + ((params.date.getMonth() + 1) <= 9 ? ('0' + (params.date.getMonth() + 1)) : ((params.date.getMonth() + 1))) + '-' + ((params.date.getDate() <= 9) ? ('0' + params.date.getDate()) : (params.date.getDate()));
}