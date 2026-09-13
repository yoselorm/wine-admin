import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Star, Check, X, MessageSquareText, Loader2 } from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import toast from '../components/Toast';
import { fetchReviews, updateReview, clearReviewStatus } from '../redux/ReviewSlice';

const StarRow = ({ rating }) => (
  <div className="flex items-center gap-0.5">
    {[1, 2, 3, 4, 5].map((n) => (
      <Star key={n} size={14} className={n <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-200'} />
    ))}
  </div>
);

const Reviews = () => {
  const dispatch = useDispatch();
  const { reviews, loading, mutationLoading, error, successMessage } = useSelector((s) => s.reviews);

  useEffect(() => {
    dispatch(fetchReviews());
  }, [dispatch]);

  useEffect(() => {
    if (error) { toast.error(error); dispatch(clearReviewStatus()); }
    if (successMessage) { toast.success(successMessage); dispatch(clearReviewStatus()); }
  }, [error, successMessage, dispatch]);

  const handleApprove = (id) => {
    dispatch(updateReview({ id, data: { status: 'approved' } }));
  };

  const handleReject = (id) => {
    dispatch(updateReview({ id, data: { status: 'rejected' } }));
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Reviews</h1>
        <p className="text-sm text-gray-500 mt-1">
          {reviews.length} review{reviews.length !== 1 ? 's' : ''} awaiting moderation. Approved reviews appear on the product page.
        </p>
      </div>

      {loading && reviews.length === 0 ? (
        <div className="flex justify-center py-16"><Loader2 className="animate-spin text-gray-400" size={22} /></div>
      ) : reviews.length === 0 ? (
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
                  {(r.customer_name || r.user?.name || '?').split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4">
                    <p className="text-sm text-gray-900">
                      <span className="font-semibold">{r.customer_name || r.user?.name || 'Customer'}</span> on <span className="font-bold">{r.product_name || r.product?.name}</span>
                    </p>
                    <StarRow rating={r.rating} />
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {r.created_at ? new Date(r.created_at).toLocaleDateString('en-US', { dateStyle: 'medium' }) : ''}
                  </p>
                  <p className="text-sm text-gray-600 mt-2 leading-relaxed">{r.comment}</p>
                  <div className="flex items-center gap-2 mt-3">
                    <Button size="sm" icon={Check} disabled={mutationLoading} onClick={() => handleApprove(r.id)}>
                      Approve
                    </Button>
                    <Button appearance="danger-outline" size="sm" icon={X} disabled={mutationLoading} onClick={() => handleReject(r.id)}>
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
