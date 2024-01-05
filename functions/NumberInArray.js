export const numberInArray = (number, array) => {
    for(let i = 0; i < array.length; i++) {
        if(array[i].to_phone === number)
            return true;
    };
    return false;
};