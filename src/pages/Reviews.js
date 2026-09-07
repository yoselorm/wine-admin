import React, { useState } from 'react';
import { Star, Check, X, MessageSquareText } from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import toast from '../components/Toast';

// NOTE: The API does not yet expose admin review-moderation endpoints.
// This screen is a design proposal using placeholder data.
const INITIAL_REVIEWS = [
  { id: 1, customer: 'Amara Mensah', product: 'Château Margaux 2015', rating: 5, date: '2026-09-02', comment: 'Exceptional bottle, arrived in perfect condition. Will order again.' },
  { id: 2, customer: 'Kwame Asante', product: 'Barolo Riserva 2016', rating: 4, date: '2026-09-01', comment: 'Great value for the price, slightly delayed delivery.' },
  { id: 3, customer: 'Elena Rostova', product: 'Dom Pérignon Vintage', rating: 2, date: '2026-08-29', comment: 'Bottle seal looked tampered with on arrival.' },
  { id: 4, customer: 'John Doe', product: 'Penfolds Grange Shiraz', rating: 5, date: '2026-08-27', comment: 'Outstanding. One of the best reds I have tasted this year.' },
];

const StarRow = ({ rating }) => (
  <div className="flex items-center gap-0.5">
    {[1, 2, 3, 4, 5].map((n) => (
      <Star key={n} size={14} className={n <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-200'} />
    ))}
  </div>
);

const Reviews = () => {
  const [reviews, setReviews] = useState(INITIAL_REVIEWS);

  const handleApprove = (id) => {
    setReviews((prev) => prev.filter((r) => r.id !== id));
    toast.success('Review approved and published.');
  };

  const handleReject = (id) => {
    setReviews((prev) => prev.filter((r) => r.id !== id));
    toast.success('Review rejected.');
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Reviews</h1>
        <p className="text-sm text-gray-500 mt-1">
          {reviews.length} review{reviews.length !== 1 ? 's' : ''} awaiting moderation. Approved reviews appear on the product page. Note: the API does not yet expose admin review-moderation endpoints — this screen is a design proposal.
        </p>
      </div>

      {reviews.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <div className="w-12 h-12 bg-gray-50 border border-gray-100 rounded-xl flex items-center justify-center mx-auto text-gray-400 mb-3">
              <MessageSquareText size={20} />
            </div>
            <h3 className="text-sm font-bold text-gray-700">Moderation queue is empty</h3>
            <p className="text-xs text-gray-400 mt-1">New reviews awaiting approval will appear here.</p>
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {reviews.map((r) => (
            <Card key={r.id}>
              <div className="flex items-start gap-4">
                <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center font-bold text-xs text-gray-500 flex-shrink-0">
                  {r.customer.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4">
                    <p className="text-sm text-gray-900">
                      <span className="font-semibold">{r.customer}</span> on <span className="font-bold">{r.product}</span>
                    </p>
                    <StarRow rating={r.rating} />
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {new Date(r.date).toLocaleDateString('en-US', { dateStyle: 'medium' })}
                  </p>
                  <p className="text-sm text-gray-600 mt-2 leading-relaxed">{r.comment}</p>
                  <div className="flex items-center gap-2 mt-3">
                    <Button size="sm" icon={Check} onClick={() => handleApprove(r.id)}>
                      Approve
                    </Button>
                    <Button appearance="danger-outline" size="sm" icon={X} onClick={() => handleReject(r.id)}>
                      Reject
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default Reviews;
