function sampleDbCall() {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve('there');
        }, 1000);
    });
}

module.exports = async (body) => {
    // do database call and return
    return await sampleDbCall();
};
