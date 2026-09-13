import React, { useEffect, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Star, Check, X, MessageSquareText, Loader2, Trash2 } from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import ConfirmDeleteModal from '../components/ConfirmDeleteModal';
import Pagination from '../components/Pagination';
import toast from '../components/Toast';
import { fetchReviews, updateReview, deleteReview, clearReviewStatus } from '../redux/ReviewSlice';
import { hasPermission } from '../utils/permissions';

const TABS = [
  { key: 'pending', label: 'Pending' },
  { key: 'approved', label: 'Approved' },
  { key: 'rejected', label: 'Rejected' },
  { key: 'all', label: 'All' },
];

// Pending is the default queue: omitting `status` entirely on the API means "pending only",
// so the Pending tab must send nothing, and only "All" sends the `all` sentinel.
const statusParamFor = (tab) => (tab === 'pending' ? undefined : tab);

const StarRow = ({ rating }) => (
  <div className="flex items-center gap-0.5">
    {[1, 2, 3, 4, 5].map((n) => (
      <Star key={n} size={14} className={n <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-200'} />
    ))}
  </div>
);

const Reviews = () => {
  const dispatch = useDispatch();
  const { reviews, pagination, loading, mutationLoading, error, successMessage } = useSelector((s) => s.reviews);
  const { admin } = useSelector((s) => s.auth);
  const canModerate = hasPermission(admin, 'manage-reviews');

  const [tab, setTab] = useState('pending');
  const [rating, setRating] = useState('');
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const loadReviews = useCallback((page = 1) => {
    dispatch(fetchReviews({
      status: statusParamFor(tab),
      rating: rating || undefined,
      search: search || undefined,
      page,
    }));
  }, [dispatch, tab, rating, search]);

  useEffect(() => {
    setCurrentPage(1);
    loadReviews(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, rating, search]);

  useEffect(() => {
    if (error) { toast.error(error); dispatch(clearReviewStatus()); }
    if (successMessage) {
      toast.success(successMessage);
      dispatch(clearReviewStatus());
      // Approve/reject/delete change which tab a review belongs in, so refetch the current
      // filtered page rather than patch it locally.
      loadReviews(currentPage);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [error, successMessage, dispatch]);

  const handlePageChange = (page) => {
    setCurrentPage(page);
    loadReviews(page);
  };

  const handleApprove = (id) => {
    dispatch(updateReview({ id, data: { status: 'approved' } }));
  };

  const handleReject = (id) => {
    dispatch(updateReview({ id, data: { status: 'rejected' } }));
  };

  const executeDelete = async () => {
    if (deleteTarget) {
      await dispatch(deleteReview(deleteTarget.id));
      setDeleteTarget(null);
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Reviews</h1>
        <p className="text-sm text-gray-500 mt-1">
          {pagination?.total ?? reviews.length} review{(pagination?.total ?? reviews.length) !== 1 ? 's' : ''} in this view. Approved reviews appear on the product page.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1 bg-gray-100 rounded-md p-1 w-fit">
          {TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                tab === t.key ? 'bg-white text-gray-900 shadow-xs' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <select
            value={rating}
            onChange={(e) => setRating(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-200 rounded-md bg-white focus:outline-none focus:border-violet-500"
          >
            <option value="">All ratings</option>
            {[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{n} star{n !== 1 ? 's' : ''}</option>)}
          </select>
          <input
            type="text"
            placeholder="Search comment..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-200 rounded-md bg-white focus:outline-none focus:border-violet-500 w-48"
          />
        </div>
      </div>

      {loading && reviews.length === 0 ? (
        <div className="flex justify-center py-16"><Loader2 className="animate-spin text-gray-400" size={22} /></div>
      ) : reviews.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <div className="w-12 h-12 bg-gray-50 border border-gray-100 rounded-xl flex items-center justify-center mx-auto text-gray-400 mb-3">
              <MessageSquareText size={20} />
            </div>
            <h3 className="text-sm font-bold text-gray-700">No reviews here</h3>
            <p className="text-xs text-gray-400 mt-1">
              {tab === 'pending' ? 'New reviews awaiting approval will appear here.' : 'Nothing matches this tab yet.'}
            </p>
          </div>
        </Card>
      ) : (
        <>
          <div className="space-y-4">
            {reviews.map((r) => (
              <Card key={r.id}>
                <div className="flex items-start gap-4">
                  <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center font-bold text-xs text-gray-500 flex-shrink-0">
                    {(r.user?.name || '?').split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <p className="text-sm text-gray-900">
                        <span className="font-semibold">{r.user?.name || 'Customer'}</span> on <span className="font-bold">{r.product?.name}</span>
                      </p>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <StarRow rating={r.rating} />
                        <Badge tone={r.status === 'approved' ? 'green' : r.status === 'rejected' ? 'red' : 'yellow'} size="sm">{r.status}</Badge>
                      </div>
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {r.created_at ? new Date(r.created_at).toLocaleDateString('en-US', { dateStyle: 'medium' }) : ''}
                    </p>
                    <p className="text-sm text-gray-600 mt-2 leading-relaxed">{r.comment}</p>
                    {canModerate && (
                      <div className="flex items-center gap-2 mt-3">
                        {r.status !== 'approved' && (
                          <Button size="sm" icon={Check} disabled={mutationLoading} onClick={() => handleApprove(r.id)}>
                            Approve
                          </Button>
                        )}
                        {r.status !== 'rejected' && (
                          <Button appearance="danger-outline" size="sm" icon={X} disabled={mutationLoading} onClick={() => handleReject(r.id)}>
                            Reject
                          </Button>
                        )}
                        <Button appearance="secondary" size="sm" icon={Trash2} disabled={mutationLoading} onClick={() => setDeleteTarget(r)}>
                          Delete
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
          {pagination && (
            <Card padded={false}>
              <div className="px-5 py-4">
                <Pagination meta={pagination} onPageChange={handlePageChange} />
              </div>
            </Card>
          )}
        </>
      )}

      <ConfirmDeleteModal
        isOpen={!!deleteTarget}
        isDeleting={mutationLoading}
        onClose={() => setDeleteTarget(null)}
        onConfirm={executeDelete}
        title="Delete Review"
        message="Remove this review permanently? This cannot be undone."
      />
    </div>
  );
};

export default Reviews;
