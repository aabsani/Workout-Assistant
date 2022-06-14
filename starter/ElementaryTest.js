const arrCenter = function (arr) {
  const midIndex = Math.floor(arr.length / 2);
  const midElement = arr[midIndex];

  if (arr.length % 2 === 0 || arr.length === 0) return 0;

  for (const i of arr) {
    if (midElement < i || arr.length === 1) return 1;
    else return 0;
  }
};

const arrInteger = function (arr) {
  // X is the sum of odd numbers
  let x = 0,
    // Y is the sum of even numbers
    y = 0;

  if (arr.length === 1) return 1;
  if (arr.length === 0) return 0;

  arr.forEach(function (element) {
    if (element % 2 === 0) {
      y += element;
    } else {
      x += element;
    }
  });
  return x - y;
};

const arrCommonInt = function (arr1, arr2) {
  const arrUnique = [];

  if (arr1.length === 0 || arr2.length === 0) return 0;

  let arrLength = 0;
  if (arr1.length > arr2.length) arrLength = arr1.length;
  else arrLength = arr2.length;

  for (let i = 0; i < arrLength; i++) {
    for (let j = 0; j < arrLength; j++) {
      if (arr1[i] === arr2[j]) {
        arrUnique[arrUnique.length] = arr1[i];
      }
    }
  }
  //remove duplicates and convert Set to Array
  const setUnique = Array.from(new Set(arrUnique));

  console.log(setUnique);
  return setUnique;
};

const test1 = [1, 3, 7, 9, 1, 8];
const test2 = [7, 1, 9, 3, 8, 3, 4, 5, 8];

arrCommonInt(test1, test2);
