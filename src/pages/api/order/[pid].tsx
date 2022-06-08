import database from '../../../database';
import {NextApiRequest, NextApiResponse} from 'next/types';
import {WhereToVote} from '@mui/icons-material';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '6mb', // Set desired value here
    },
    responseLimit: '6mb',
  },
};

export default async (req: NextApiRequest, res: NextApiResponse) => {
  const {
    query: {pid},
    method,
  } = req;
  console.log('pid: ', pid);
  console.log('req query', req.query);
  console.log('req body', req.body);
  if (!pid) {
    return res.status(404).json({
      message: 'Not Found',
    });
  }
  if (method === 'POST') {
    console.log('Item', req.body.itemId);
    try {
      const orderedItem = await database('order_items')
        .select('item_id', 'quantity', 'status')
        .where('order_id', pid)
        .andWhere('item_id', req.body.itemId);
      console.log('orderedItem: ', orderedItem);
      console.log('orderedItem.length: ', orderedItem.length);

      if (!orderedItem[0]) {
        await database('order_items').insert({
          order_id: pid,
          item_id: req.body.itemId,
        });
        return res
          .status(200)
          .json({message: `Added ${req.body.itemId} to order ${pid}`});
      }
      // if (orderedItem.length < 2) {
      //   await database('order_items').insert({
      //     order_id: pid,
      //     item_id: req.body.itemId,
      //   });
      //   return res
      //     .status(200)
      //     .json({message: `Added ${req.body.itemId} to order ${pid}`});
      // }

      if (orderedItem[0]) {
        const newQuantity = orderedItem[0].quantity + 1;
        await database('order_items')
          .where({order_id: pid, item_id: req.body.itemId})
          .update({
            quantity: newQuantity,
          });
        return res
          .status(200)
          .json({message: `Added ${req.body.itemId} to order ${pid}`});
      }
    } catch (e) {
      return res.status(500).json({message: `Error: ${e}`});
    }
  }
  if (method === 'PATCH') {
    try {
      if (!req.body.quantity || req.body.quantity < 1) {
        await database('order_items')
          .update({
            quantity: 0,
          })
          .where({
            order_id: pid,
            id: req.body.orderItemId,
          });
        return res
          .status(200)
          .json({message: `Updated ${req.query.itemId} of order ${pid}`});
      }
      if (req.body.quantity > 0) {
        console.log('patching');
        await database('order_items')
          .update({
            quantity: req.body.quantity,
            // status: req.body.status,
          })
          .where({
            order_id: pid,
            id: req.body.orderItemId,
          });

        return res
          .status(200)
          .json({message: `Updated ${req.query.itemId} of order ${pid}`});
      }
    } catch (e) {
      return res.status(500).json({message: `Error: ${e}`});
    }
  }
  if (method === 'DELETE') {
    try {
      await database('order_items').delete().where({
        order_id: pid,
        item_id: req.query.itemId,
      });
      return res
        .status(200)
        .json({message: `Deleted item ${req.query.itemId} of order ${pid}`});
    } catch (e) {
      return res.status(500).json({message: `Error: ${e}`});
    }
  }

  if (method === 'GET') {
    try {
      const getOrderedItems = await database('order')
        .select(
          'order_items.id as orderItemId',
          'order.room_id as roomId',
          'order_items.item_id as itemId',
          'order_items.quantity',
          'order_items.status',
          'order.id as orderId',
          'order.user_id as userId',
          'order_items.created as addedAt',
          'items.name',
          'items.price',
          'items.native_name as nativeName',
          'items.type as itemType',
          'items.quantitive',
          'items.tag',
        )
        .leftJoin('order_items', 'order_items.order_id', '=', 'order.id')
        .leftJoin('items', 'items.id', '=', 'order_items.item_id')
        .where('order_items.order_id', pid)
        .where('order.room_id', req.query.roomId);

      return res.status(200).json(getOrderedItems);
    } catch (e) {
      return res.status(500).json({message: `Error: ${e}`});
    }
  }
};
