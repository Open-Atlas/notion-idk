const notion = global.notion.client;
// see example here: https://developers.notion.com/reference/post-page

exports.page = async ({parentId, properties}) => {
  try {
    return await notion.pages.create({
    /* 'cover': {
      'type': 'external',
      'external': {
        'url': 'https://upload.wikimedia.org/wikipedia/commons/6/62/Tuscankale.jpg',
      },
    },
    'icon': {
      'type': 'emoji',
      'emoji': '🥬',
    }, */
      'parent': {
        'type': 'database_id',
        'database_id': parentId,
      },
      properties,
      /* 'children': [
      {
        'object': 'block',
        'heading_2': {
          'rich_text': [
            {
              'text': {
                'content': 'Lacinato kale',
              },
            },
          ],
        },
      },
      {
        'object': 'block',
        'paragraph': {
          'rich_text': [
            {
              'text': {
                // eslint-disable-next-line max-len
                'content': ' tree kale, or black Tuscan palm.',
                'link': {
                  'url': 'https://en.wikipedia.org/wiki/Lacinato_kale',
                },
              },
              'href': 'https://en.wikipedia.org/wiki/Lacinato_kale',
            },
          ],
          'color': 'default',
        },
      },
    ], */
    });
  } catch (e) {
    console.log(e);
  }
};
