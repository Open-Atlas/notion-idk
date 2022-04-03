
const title = {
  property: 'title',
};

exports.getTitle = (properties) => {
  // doesn't work if string is empty
  // const [, {title: [{plain_text}]}] = Object.entries(properties).find(([, value]) => value.id == 'title');

  // TO-EVALUATE: maybe add function to Object prototype?
  try {
    const [property, {title: [{plain_text: name}]}] = Object.entries(properties).find(([key, value]) => {
      return value.id == 'title';
    });
    title.property = property;
    delete entry.properties[property];
    // console.log('PAGE TITLE', title);
    return name;
  } catch (e) {
    // console.log(e);
    return '';
  }
  // const [, {title: [title]}] = Object.entries(properties).find(([, value]) => value.id == 'title');
  return title;
};
